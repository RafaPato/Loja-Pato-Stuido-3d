// Estimativa de margem bruta simplificada: só filamento + tempo de máquina, com base em premissas
// de peso/tempo informadas em product-ideas.mjs. NÃO inclui mão de obra, embalagem, envio ou taxa
// de plataforma — para o custo completo, use o Precificador 3D (index.html) com os valores reais
// da peça. Isso aqui é só uma triagem rápida de "vale a pena olhar melhor", não o preço final.

/** @returns custo de produção em centavos, ou null se faltar algum dado de entrada. */
export function estimateProductionCostCents({
  weightGrams,
  printHours,
  filamentPricePerKgCents,
  machineCostPerHourCents,
}) {
  if (
    !(weightGrams > 0) ||
    !(printHours >= 0) ||
    !(filamentPricePerKgCents > 0) ||
    !(machineCostPerHourCents >= 0)
  ) {
    return null;
  }
  const materialCostCents = (weightGrams / 1000) * filamentPricePerKgCents;
  const machineCostCents = printHours * machineCostPerHourCents;
  return Math.round(materialCostCents + machineCostCents);
}

/**
 * Margem bruta estimada comparando um preço de mercado observado (ex: mediana da amostra) com o
 * custo de produção simplificado. Retorna null quando falta preço de mercado ou custo.
 */
export function estimateGrossMargin({ marketPriceCents, productionCostCents }) {
  if (!(marketPriceCents > 0) || productionCostCents === null || productionCostCents === undefined) {
    return null;
  }
  const marginCents = marketPriceCents - productionCostCents;
  const marginPct = (marginCents / marketPriceCents) * 100;
  return { marginCents, marginPct };
}
