// Heurística simples para extrair quantidade/unidade do título de um anúncio, o
// suficiente para normalizar filamento (kg) e plástico bolha (m). Quando não dá para
// reconhecer com confiança, o anúncio fica marcado como não normalizado ("anuncio") —
// melhor mostrar isso claramente do que arriscar uma comparação de preço errada.
const KG_PATTERN = /(\d+(?:[.,]\d+)?)\s*kg\b/i;
const G_PATTERN = /(\d+(?:[.,]\d+)?)\s*g\b/i;
const M_PATTERN = /(\d+(?:[.,]\d+)?)\s*m(?:etros)?\b/i;

function parseLocaleNumber(text) {
  return parseFloat(text.replace(",", "."));
}

export function guessQuantity(title, baseUnit) {
  const text = String(title || "").toLowerCase();

  if (baseUnit === "kg") {
    const kgMatch = text.match(KG_PATTERN);
    if (kgMatch) return { quantity: parseLocaleNumber(kgMatch[1]), unit: "kg" };

    const gMatch = text.match(G_PATTERN);
    if (gMatch) return { quantity: parseLocaleNumber(gMatch[1]) / 1000, unit: "kg" };
  }

  if (baseUnit === "m") {
    const mMatch = text.match(M_PATTERN);
    if (mMatch) return { quantity: parseLocaleNumber(mMatch[1]), unit: "m" };
  }

  return { quantity: 1, unit: "anuncio" };
}

/** Retorna o preço por unidade base em centavos, ou null quando não é comparável. */
export function pricePerBaseUnit(priceCents, quantity, unit, baseUnit) {
  if (unit !== baseUnit || !(quantity > 0) || !(priceCents > 0)) return null;
  return Math.round(priceCents / quantity);
}
