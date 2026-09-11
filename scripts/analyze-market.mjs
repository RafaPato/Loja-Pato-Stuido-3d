#!/usr/bin/env node
// Motor de análise de mercado — roda via GitHub Actions (ver .github/workflows/market-analysis.yml).
// Diferente do collect-prices.mjs (que só grava o menor preço do dia), este script analisa uma
// amostra maior de anúncios do Mercado Livre por material e produz distribuição de preço, ranking
// de vendedores e taxa de anúncios em promoção. Grava em data/analise-mercado.json.
//
// Cobertura de Shopee não entra aqui: não existe API pública de busca de mercado para terceiros
// na Shopee (só Open Platform para a própria loja, ou Affiliate API para produtos promovidos).
// Scraping de terceiro contra a Shopee foi decidido explicitamente como fora de escopo (risco de
// ToS). A leitura qualitativa de Shopee é feita pela rotina de monitoramento diário via busca na
// web, fora deste repositório.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MATERIALS } from "./lib/materials.mjs";
import { searchMercadoLivreMarket } from "./lib/connectors/mercado-livre.mjs";
import { analyzeMaterial } from "./lib/market-analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "data", "analise-mercado.json");

async function analyzeOneMaterial(material) {
  if (material.search?.connector !== "mercado_livre") {
    return { materialId: material.id, error: "conector não suportado pelo motor de análise" };
  }

  try {
    const listings = await searchMercadoLivreMarket({ query: material.search.query, limit: 50 });
    return {
      materialId: material.id,
      name: material.name,
      category: material.category,
      marketplace: "mercado_livre",
      ...analyzeMaterial(listings),
    };
  } catch (err) {
    console.error(`[${material.id}] falha na análise de mercado: ${err.message}`);
    return { materialId: material.id, name: material.name, category: material.category, error: err.message };
  }
}

async function main() {
  const analyses = [];
  for (const material of MATERIALS) {
    analyses.push(await analyzeOneMaterial(material));
  }

  const output = {
    generatedAt: new Date().toISOString(),
    materials: analyses,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Análise de mercado gravada em ${OUTPUT_PATH}.`);
}

main().catch((err) => {
  console.error("Falha no motor de análise de mercado:", err);
  process.exitCode = 1;
});
