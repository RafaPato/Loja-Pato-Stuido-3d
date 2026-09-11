#!/usr/bin/env node
// Roda via GitHub Actions (ver .github/workflows/collect-prices.yml). Busca preços atuais
// nos conectores configurados e atualiza data/precos.json, sem nunca tocar nas cotações
// manuais (source "manual") — elas são o fallback quando um conector falha ou não existe
// para um fornecedor. Cotações automáticas de uma execução anterior são substituídas
// inteiramente a cada rodada, para não acumular preços velhos.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MATERIALS } from "./lib/materials.mjs";
import { searchMercadoLivre } from "./lib/connectors/mercado-livre.mjs";
import { guessQuantity, pricePerBaseUnit } from "./lib/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "precos.json");

const CONNECTORS = {
  mercado_livre: searchMercadoLivre,
};

const isAutomatic = (source) => source.startsWith("api:") || source.startsWith("scrape:");

async function loadData() {
  const raw = await readFile(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function collectForMaterial(material) {
  const connector = CONNECTORS[material.search?.connector];
  if (!connector) {
    console.warn(`[${material.id}] nenhum conector configurado para "${material.search?.connector}"`);
    return [];
  }

  let results;
  try {
    results = await connector(material.search);
  } catch (err) {
    console.error(`[${material.id}] falha ao coletar via ${material.search.connector}: ${err.message}`);
    return [];
  }

  const capturedAt = new Date().toISOString();
  return results.map((result) => {
    const { quantity, unit } = guessQuantity(result.title, material.baseUnit);
    return {
      supplier: result.supplier,
      title: result.title,
      priceCents: result.priceCents,
      quantity,
      unit,
      pricePerBaseUnitCents: pricePerBaseUnit(result.priceCents, quantity, unit, material.baseUnit),
      source: result.source,
      url: result.url,
      capturedAt,
    };
  });
}

async function main() {
  const data = await loadData();
  const byId = new Map((data.materials || []).map((material) => [material.id, material]));

  for (const material of MATERIALS) {
    const entry = byId.get(material.id) ?? { id: material.id, quotes: [] };
    entry.name = material.name;
    entry.category = material.category;
    entry.baseUnit = material.baseUnit;

    const manualQuotes = (entry.quotes || []).filter((quote) => !isAutomatic(quote.source));
    const autoQuotes = await collectForMaterial(material);
    entry.quotes = [...manualQuotes, ...autoQuotes];

    byId.set(material.id, entry);
  }

  data.materials = Array.from(byId.values());
  data.updatedAt = new Date().toISOString();

  await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Atualizado ${DATA_PATH} com sucesso.`);
}

main().catch((err) => {
  console.error("Falha no coletor de preços:", err);
  process.exitCode = 1;
});
