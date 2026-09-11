import { test } from "node:test";
import assert from "node:assert/strict";
import { guessQuantity, pricePerBaseUnit } from "./normalize.mjs";

test("guessQuantity reconhece quilos no título", () => {
  assert.deepEqual(guessQuantity("Filamento PLA 1.75mm 1kg Natural", "kg"), { quantity: 1, unit: "kg" });
});

test("guessQuantity converte gramas para quilos", () => {
  assert.deepEqual(guessQuantity("Filamento PETG 500g Preto", "kg"), { quantity: 0.5, unit: "kg" });
});

test("guessQuantity reconhece metros no título", () => {
  assert.deepEqual(guessQuantity("Plástico bolha rolo 50 metros", "m"), { quantity: 50, unit: "m" });
});

test("guessQuantity cai para anuncio quando não reconhece a unidade", () => {
  assert.deepEqual(guessQuantity("Caixa de papelão reforçada", "unidade"), { quantity: 1, unit: "anuncio" });
});

test("pricePerBaseUnit calcula o preço normalizado quando a unidade bate com a base", () => {
  assert.equal(pricePerBaseUnit(8990, 1, "kg", "kg"), 8990);
  assert.equal(pricePerBaseUnit(4995, 0.5, "kg", "kg"), 9990);
});

test("pricePerBaseUnit retorna null quando não é comparável", () => {
  assert.equal(pricePerBaseUnit(1000, 1, "anuncio", "kg"), null);
  assert.equal(pricePerBaseUnit(1000, 0, "kg", "kg"), null);
});
