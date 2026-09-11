// Conector de API oficial — busca do Mercado Livre. O endpoint de busca por texto às vezes
// responde 403 para chamadas sem autenticação, dependendo do IP de origem e da política
// vigente da API. Quando a env var MERCADO_LIVRE_ACCESS_TOKEN estiver definida (secret do
// GitHub Actions, nunca hardcoded), ela é enviada como Bearer token. Sem o secret, o
// conector tenta sem autenticação e simplesmente não retorna cotações se vier 403 — o
// coletor principal já trata isso como uma falha recuperável, sem quebrar o restante.
import { safeFetchJson } from "../safe-fetch.mjs";

const ALLOWED_HOSTS = ["api.mercadolibre.com"];
const SITE_ID = "MLB"; // Mercado Livre Brasil

async function fetchListings({ query, limit }) {
  const url = new URL(`https://api.mercadolibre.com/sites/${SITE_ID}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(Math.max(Number(limit) || 5, 1), 50)));

  const accessToken = process.env.MERCADO_LIVRE_ACCESS_TOKEN;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  const data = await safeFetchJson(url.toString(), { allowedHosts: ALLOWED_HOSTS, headers });
  return Array.isArray(data.results) ? data.results : [];
}

export async function searchMercadoLivre({ query, limit = 5 }) {
  const results = await fetchListings({ query, limit });

  return results
    .map((item) => ({
      supplier: typeof item?.seller?.nickname === "string" ? item.seller.nickname : "Mercado Livre",
      title: String(item?.title || ""),
      priceCents: Math.round(Number(item?.price) * 100),
      url: typeof item?.permalink === "string" ? item.permalink : "",
      source: "api:mercado_livre",
    }))
    .filter((quote) => Number.isFinite(quote.priceCents) && quote.priceCents > 0);
}

/**
 * Versão "rica" para o motor de análise de mercado: traz uma amostra maior de anúncios e
 * campos adicionais (vendedor, preço original quando em promoção, quantidade vendida, frete
 * grátis) — usados para estatística de distribuição de preço, não só o mais barato.
 */
export async function searchMercadoLivreMarket({ query, limit = 50 }) {
  const results = await fetchListings({ query, limit });

  return results
    .map((item) => {
      const priceCents = Math.round(Number(item?.price) * 100);
      const originalPriceCents = Number.isFinite(Number(item?.original_price))
        ? Math.round(Number(item.original_price) * 100)
        : null;
      return {
        sellerName: typeof item?.seller?.nickname === "string" ? item.seller.nickname : null,
        title: String(item?.title || ""),
        priceCents,
        originalPriceCents,
        soldQuantity: Number.isFinite(Number(item?.sold_quantity)) ? Number(item.sold_quantity) : null,
        freeShipping: Boolean(item?.shipping?.free_shipping),
        url: typeof item?.permalink === "string" ? item.permalink : "",
      };
    })
    .filter((listing) => Number.isFinite(listing.priceCents) && listing.priceCents > 0);
}
