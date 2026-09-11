#!/usr/bin/env node
// Motor de oportunidade de produto — roda via GitHub Actions (mesmo workflow semanal do motor de
// análise de mercado). Para cada "ideia de produto" em scripts/lib/product-ideas.mjs, busca no
// Mercado Livre o que já se vende parecido, e estima uma margem bruta simplificada comparando o
// preço de mercado (mediana da amostra) com um custo de produção baseado nas premissas de peso e
// tempo de impressão configuradas — NÃO é o cálculo completo do Precificador 3D (sem mão de obra,
// embalagem, envio ou taxa de plataforma). Serve para triagem, não para decidir preço final.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_IDEAS, DEFAULT_MACHINE_COST_PER_HOUR_CENTS } from "./lib/product-ideas.mjs";
import { searchMercadoLivreMarket } from "./lib/connectors/mercado-livre.mjs";
import { analyzeMaterial } from "./lib/market-analysis.mjs";
import { estimateProductionCostCents, estimateGrossMargin } from "./lib/margin-analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRECOS_PATH = path.join(__dirname, "..", "data", "precos.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "oportunidades-produto.json");

/** Menor pricePerBaseUnitCents confirmado hoje para uma categoria de material, ou null. */
function cheapestPricePerKg(precosData, category) {
  const material = (precosData.materials || []).find((m) => m.category === category);
  if (!material) return null;
  const confirmed = (material.quotes || [])
    .map((q) => q.pricePerBaseUnitCents)
    .filter((v) => Number.isFinite(v) && v > 0);
  return confirmed.length > 0 ? Math.min(...confirmed) : null;
}

async function analyzeOneIdea(idea, precosData) {
  const filamentPricePerKgCents = cheapestPricePerKg(precosData, idea.materialId);

  let listings;
  try {
    listings = await searchMercadoLivreMarket({ query: idea.searchQuery, limit: 50 });
  } catch (err) {
    console.error(`[${idea.id}] falha ao buscar mercado: ${err.message}`);
    return { productId: idea.id, name: idea.name, error: err.message };
  }

  const marketAnalysis = analyzeMaterial(listings);

  const productionCostCents = estimateProductionCostCents({
    weightGrams: idea.estimatedWeightGrams,
    printHours: idea.estimatedPrintHours,
    filamentPricePerKgCents,
    machineCostPerHourCents: DEFAULT_MACHINE_COST_PER_HOUR_CENTS,
  });

  const grossMargin = estimateGrossMargin({
    marketPriceCents: marketAnalysis.priceDistribution.medianCents,
    productionCostCents,
  });

  return {
    productId: idea.id,
    name: idea.name,
    searchQuery: idea.searchQuery,
    assumptions: {
      estimatedWeightGrams: idea.estimatedWeightGrams,
      estimatedPrintHours: idea.estimatedPrintHours,
      filamentPricePerKgCentsUsed: filamentPricePerKgCents,
      machineCostPerHourCents: DEFAULT_MACHINE_COST_PER_HOUR_CENTS,
    },
    marketAnalysis,
    estimatedProductionCostCents: productionCostCents,
    estimatedGrossMargin: grossMargin,
  };
}

async function main() {
  const precosData = JSON.parse(await readFile(PRECOS_PATH, "utf8"));

  const opportunities = [];
  for (const idea of PRODUCT_IDEAS) {
    opportunities.push(await analyzeOneIdea(idea, precosData));
  }

  const output = { generatedAt: new Date().toISOString(), products: opportunities };
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Análise de oportunidade de produto gravada em ${OUTPUT_PATH}.`);
}

main().catch((err) => {
  console.error("Falha no motor de oportunidade de produto:", err);
  process.exitCode = 1;
});
