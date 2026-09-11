// Estatística sobre uma lista de anúncios (já coletados por um conector) de um único material.
// Não faz nenhuma requisição de rede — só agrega o que já foi buscado, então é seguro de testar
// isoladamente com dados fixos.

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * @param {Array<{priceCents: number, sellerName: string, originalPriceCents?: number|null}>} listings
 */
export function analyzePriceDistribution(listings) {
  const prices = listings
    .map((l) => l.priceCents)
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return { count: 0, minCents: null, medianCents: null, maxCents: null, p25Cents: null, p75Cents: null };
  }

  return {
    count: prices.length,
    minCents: prices[0],
    p25Cents: Math.round(percentile(prices, 0.25)),
    medianCents: Math.round(percentile(prices, 0.5)),
    p75Cents: Math.round(percentile(prices, 0.75)),
    maxCents: prices[prices.length - 1],
  };
}

/** Ranking de vendedores por número de anúncios encontrados na amostra coletada. */
export function rankSellers(listings, limit = 5) {
  const counts = new Map();
  for (const listing of listings) {
    const seller = listing.sellerName || "Vendedor não identificado";
    counts.set(seller, (counts.get(seller) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([sellerName, listingCount]) => ({ sellerName, listingCount }))
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, limit);
}

/** Fração de anúncios da amostra que estão com preço promocional (original_price > price). */
export function discountRate(listings) {
  if (listings.length === 0) return null;
  const discounted = listings.filter(
    (l) => Number.isFinite(l.originalPriceCents) && l.originalPriceCents > l.priceCents,
  ).length;
  return discounted / listings.length;
}

export function analyzeMaterial(listings) {
  return {
    sampleSize: listings.length,
    priceDistribution: analyzePriceDistribution(listings),
    topSellers: rankSellers(listings),
    discountRate: discountRate(listings),
  };
}
