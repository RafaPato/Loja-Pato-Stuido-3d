import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateProductionCostCents, estimateGrossMargin } from "./margin-analysis.mjs";

test("estimateProductionCostCents soma material + máquina", () => {
  const cost = estimateProductionCostCents({
    weightGrams: 60,
    printHours: 3,
    filamentPricePerKgCents: 8990,
    machineCostPerHourCents: 180,
  });
  // material: 0.06kg * 8990 = 539,4 -> 539; máquina: 3 * 180 = 540; total 1079
  assert.equal(cost, 1079);
});

test("estimateProductionCostCents retorna null quando falta dado de entrada", () => {
  assert.equal(
    estimateProductionCostCents({ weightGrams: 0, printHours: 3, filamentPricePerKgCents: 8990, machineCostPerHourCents: 180 }),
    null,
  );
  assert.equal(
    estimateProductionCostCents({ weightGrams: 60, printHours: 3, filamentPricePerKgCents: null, machineCostPerHourCents: 180 }),
    null,
  );
});

test("estimateGrossMargin calcula margem em centavos e em %", () => {
  const margin = estimateGrossMargin({ marketPriceCents: 5000, productionCostCents: 1079 });
  assert.equal(margin.marginCents, 3921);
  assert.ok(Math.abs(margin.marginPct - 78.42) < 0.01);
});

test("estimateGrossMargin retorna null sem preço de mercado ou custo", () => {
  assert.equal(estimateGrossMargin({ marketPriceCents: 0, productionCostCents: 1000 }), null);
  assert.equal(estimateGrossMargin({ marketPriceCents: 5000, productionCostCents: null }), null);
});
