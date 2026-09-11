// Cliente HTTP para o coletor de preços, feito para resistir a SSRF:
// - só aceita hosts de uma allow-list explícita (nunca uma URL arbitrária vinda de dados);
// - resolve o DNS antes de conectar e recusa IPs privados/loopback/link-local/reservados;
// - conecta exatamente no IP validado (via a opção `lookup`), então uma resposta DNS
//   diferente entre a validação e a conexão (DNS rebinding) não tem efeito;
// - segue redirects manualmente, revalidando allow-list e IP a cada salto;
// - aplica timeout e um teto de tamanho de resposta.
import { request as httpsRequest } from "node:https";
import net from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function ipv4ToLong(ip) {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
  );
}

function ipv4InRange(ipLong, base, prefixBits) {
  const mask = prefixBits === 0 ? 0 : (~0 << (32 - prefixBits)) >>> 0;
  return (ipLong & mask) === (ipv4ToLong(base) & mask);
}

// RFC 1918/5735/6598 e afins — qualquer coisa que não seja um IP público roteável.
const PRIVATE_V4_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const long = ipv4ToLong(ip);
    return PRIVATE_V4_RANGES.some(([base, bits]) => ipv4InRange(long, base, bits));
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 (ULA)
    if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10 (link-local)
    if (normalized.startsWith("::ffff:")) {
      const embeddedV4 = normalized.split(":").pop();
      if (net.isIPv4(embeddedV4)) return isPrivateIp(embeddedV4);
    }
    return false;
  }
  return true; // formato desconhecido — recusa por padrão
}

async function resolveAndValidate(hostname) {
  const { address } = await dnsLookup(hostname, { all: false });
  if (isPrivateIp(address)) {
    throw new Error(`Host "${hostname}" resolve para um IP não público (${address}) — recusado`);
  }
  return address;
}

function fetchOnce(urlString, { allowedHosts, headers, redirectsLeft }) {
  const url = new URL(urlString);

  if (url.protocol !== "https:") {
    return Promise.reject(new Error(`Protocolo não permitido em "${urlString}": use https`));
  }
  if (!allowedHosts.includes(url.hostname)) {
    return Promise.reject(new Error(`Host "${url.hostname}" não está na allow-list de coleta`));
  }

  return resolveAndValidate(url.hostname).then(
    (address) =>
      new Promise((resolve, reject) => {
        const req = httpsRequest(
          {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: "GET",
            headers: {
              "User-Agent": "pato-studio-price-collector/1.0 (+github actions)",
              Accept: "application/json",
              ...headers,
            },
            timeout: REQUEST_TIMEOUT_MS,
            // Conecta no IP já validado — não deixa uma segunda resolução de DNS decidir o destino.
            // Node usa Happy Eyeballs (RFC 8305) por padrão e pode chamar esta função pedindo
            // todos os endereços (`opts.all`); suportamos as duas formas de callback.
            lookup: (_hostname, opts, callback) => {
              const family = net.isIPv6(address) ? 6 : 4;
              if (opts && opts.all) {
                callback(null, [{ address, family }]);
              } else {
                callback(null, address, family);
              }
            },
          },
          (res) => {
            if (REDIRECT_STATUS_CODES.has(res.statusCode) && res.headers.location) {
              res.resume();
              if (redirectsLeft <= 0) {
                reject(new Error(`Excesso de redirecionamentos a partir de "${urlString}"`));
                return;
              }
              const nextUrl = new URL(res.headers.location, url);
              resolve(fetchOnce(nextUrl.toString(), { allowedHosts, headers, redirectsLeft: redirectsLeft - 1 }));
              return;
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
              res.resume();
              reject(new Error(`HTTP ${res.statusCode} ao buscar "${urlString}"`));
              return;
            }

            let size = 0;
            const chunks = [];
            res.on("data", (chunk) => {
              size += chunk.length;
              if (size > MAX_RESPONSE_BYTES) {
                req.destroy(new Error(`Resposta de "${url.hostname}" excede o tamanho máximo permitido`));
                return;
              }
              chunks.push(chunk);
            });
            res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            res.on("error", reject);
          },
        );

        req.on("timeout", () => req.destroy(new Error(`Timeout ao buscar "${urlString}"`)));
        req.on("error", reject);
        req.end();
      }),
  );
}

/**
 * Busca JSON de uma URL https, restrita a `allowedHosts`. Nunca aceite `allowedHosts`
 * vindo de dados externos — é uma lista fixa de domínios de fornecedores/APIs confiáveis.
 */
export async function safeFetchJson(urlString, { allowedHosts, headers } = {}) {
  if (!Array.isArray(allowedHosts) || allowedHosts.length === 0) {
    throw new Error("safeFetchJson requer allowedHosts não vazio");
  }
  const body = await fetchOnce(urlString, { allowedHosts, headers, redirectsLeft: MAX_REDIRECTS });
  return JSON.parse(body);
}
