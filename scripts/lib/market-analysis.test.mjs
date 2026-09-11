import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzePriceDistribution,
  rankSellers,
  discountRate,
  mostSoldListings,
  analyzeMaterial,
} from "./market-analysis.mjs";

test("analyzePriceDistribution calcula min/mediana/max/percentis", () => {
  const listings = [100, 200, 300, 400, 500].map((priceCents) => ({ priceCents }));
  const result = analyzePriceDistribution(listings);
  assert.equal(result.count, 5);
  assert.equal(result.minCents, 100);
  assert.equal(result.medianCents, 300);
  assert.equal(result.maxCents, 500);
});

test("analyzePriceDistribution ignora preços inválidos e trata amostra vazia", () => {
  assert.deepEqual(analyzePriceDistribution([{ priceCents: 0 }, { priceCents: NaN }]), {
    count: 0,
    minCents: null,
    medianCents: null,
    maxCents: null,
    p25Cents: null,
    p75Cents: null,
  });
});

test("rankSellers ordena por número de anúncios e respeita o limite", () => {
  const listings = [
    { sellerName: "A" },
    { sellerName: "B" },
    { sellerName: "A" },
    { sellerName: "A" },
    { sellerName: "C" },
  ];
  const ranking = rankSellers(listings, 2);
  assert.deepEqual(ranking, [
    { sellerName: "A", listingCount: 3 },
    { sellerName: "B", listingCount: 1 },
  ]);
});

test("rankSellers agrupa anúncios sem vendedor identificado", () => {
  const ranking = rankSellers([{ sellerName: null }, { sellerName: "" }]);
  assert.deepEqual(ranking, [{ sellerName: "Vendedor não identificado", listingCount: 2 }]);
});

test("discountRate calcula a fração de anúncios com preço promocional", () => {
  const listings = [
    { priceCents: 100, originalPriceCents: 150 },
    { priceCents: 100, originalPriceCents: null },
    { priceCents: 100, originalPriceCents: 100 },
    { priceCents: 100, originalPriceCents: 200 },
  ];
  assert.equal(discountRate(listings), 0.5);
});

test("discountRate retorna null para amostra vazia", () => {
  assert.equal(discountRate([]), null);
});

test("mostSoldListings ordena por quantidade vendida e ignora sem dado", () => {
  const listings = [
    { title: "A", sellerName: "Loja A", soldQuantity: 50, priceCents: 100, url: "https://a" },
    { title: "B", sellerName: "Loja B", soldQuantity: null, priceCents: 200, url: "https://b" },
    { title: "C", sellerName: "Loja C", soldQuantity: 500, priceCents: 300, url: "https://c" },
  ];
  const result = mostSoldListings(listings, 2);
  assert.deepEqual(result, [
    { title: "C", sellerName: "Loja C", soldQuantity: 500, priceCents: 300, url: "https://c" },
    { title: "A", sellerName: "Loja A", soldQuantity: 50, priceCents: 100, url: "https://a" },
  ]);
});

test("mostSoldListings retorna vazio quando nenhum anúncio tem quantidade vendida", () => {
  assert.deepEqual(mostSoldListings([{ soldQuantity: null }, { soldQuantity: 0 }]), []);
});

test("analyzeMaterial combina as quatro análises", () => {
  const listings = [
    { priceCents: 100, sellerName: "A", originalPriceCents: 150, soldQuantity: 10 },
    { priceCents: 200, sellerName: "B", originalPriceCents: null, soldQuantity: 5 },
  ];
  const result = analyzeMaterial(listings);
  assert.equal(result.sampleSize, 2);
  assert.equal(result.priceDistribution.count, 2);
  assert.equal(result.topSellers.length, 2);
  assert.equal(result.discountRate, 0.5);
  assert.equal(result.mostSold.length, 2);
  assert.equal(result.mostSold[0].soldQuantity, 10);
});
