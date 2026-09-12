import test from "node:test";
import assert from "node:assert/strict";
import { computeMatrixDefenseCell, computeMatrixOffenseCell } from "../src/lib/team/typeMatrixModal";
import type { TypeChart } from "../src/lib/types";

const sampleTypeChart: TypeChart = {
  types: ["water", "fire", "grass"],
  chart: {
    water: { fire: 2, grass: 0.5, water: 0.5 },
    fire: { grass: 2, water: 0.5, fire: 0.5 },
    grass: { water: 2, fire: 0.5, grass: 0.5 },
  },
};

test("team type matrix - computeMatrixDefenseCell", () => {
  // Fire Pokémon vs Water attack: 2x weak
  const cell1 = computeMatrixDefenseCell(sampleTypeChart, "water", ["fire"]);
  assert.equal(cell1.multiplier, 2);
  assert.equal(cell1.label, "2×");
  assert.equal(cell1.badgeClass, "matrix-badge--2x");

  // Water Pokémon vs Fire attack: 0.5x resist
  const cell2 = computeMatrixDefenseCell(sampleTypeChart, "fire", ["water"]);
  assert.equal(cell2.multiplier, 0.5);
  assert.equal(cell2.label, "½");
  assert.equal(cell2.badgeClass, "matrix-badge--half");
});

test("team type matrix - computeMatrixOffenseCell", () => {
  // Water attack vs Fire defender: 2x super-effective
  const cell1 = computeMatrixOffenseCell(sampleTypeChart, "fire", ["water"]);
  assert.equal(cell1.multiplier, 2);
  assert.equal(cell1.label, "2×");
  assert.equal(cell1.badgeClass, "matrix-badge--super");

  // Grass attack vs Fire defender: 0.5x not very effective
  const cell2 = computeMatrixOffenseCell(sampleTypeChart, "fire", ["grass"]);
  assert.equal(cell2.multiplier, 0.5);
  assert.equal(cell2.label, "½");
  assert.equal(cell2.badgeClass, "matrix-badge--notvery");
});
