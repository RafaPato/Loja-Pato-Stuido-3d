// Conector de API oficial — busca do Mercado Livre. O endpoint de busca por texto às vezes
// responde 403 para chamadas sem autenticação, dependendo do IP de origem e da política
// vigente da API. Quando a env var MERCADO_LIVRE_ACCESS_TOKEN estiver definida (secret do
// GitHub Actions, nunca hardcoded), ela é enviada como Bearer token. Sem o secret, o
// conector tenta sem autenticação e simplesmente não retorna cotações se vier 403 — o
// coletor principal já trata isso como uma falha recuperável, sem quebrar o restante.
import { safeFetchJson } from "../safe-fetch.mjs";

const ALLOWED_HOSTS = ["api.mercadolibre.com"];
const SITE_ID = "MLB"; // Mercado Livre Brasil

export async function searchMercadoLivre({ query, limit = 5 }) {
  const url = new URL(`https://api.mercadolibre.com/sites/${SITE_ID}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(Math.max(Number(limit) || 5, 1), 20)));

  const accessToken = process.env.MERCADO_LIVRE_ACCESS_TOKEN;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  const data = await safeFetchJson(url.toString(), { allowedHosts: ALLOWED_HOSTS, headers });

  return (Array.isArray(data.results) ? data.results : [])
    .map((item) => ({
      supplier: typeof item?.seller?.nickname === "string" ? item.seller.nickname : "Mercado Livre",
      title: String(item?.title || ""),
      priceCents: Math.round(Number(item?.price) * 100),
      url: typeof item?.permalink === "string" ? item.permalink : "",
      source: "api:mercado_livre",
    }))
    .filter((quote) => Number.isFinite(quote.priceCents) && quote.priceCents > 0);
}
