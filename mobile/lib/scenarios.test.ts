import assert from "node:assert/strict";
import { test } from "node:test";

import { TERRAIN_CELLS } from "./demoRegion";
import { generateReadingsForScenario, SCENARIOS } from "./scenarios";
import { ScenarioId } from "./types";

const ALL_SCENARIOS: ScenarioId[] = ["NORMAL", "HEAVY_RAIN", "CRITICAL_LANDSLIDE_RISK"];

test("generates exactly one reading per terrain cell", () => {
  const readings = generateReadingsForScenario("NORMAL");
  assert.equal(readings.length, TERRAIN_CELLS.length);
  const cellIds = new Set(readings.map((r) => r.cellId));
  assert.equal(cellIds.size, TERRAIN_CELLS.length);
});

for (const scenario of ALL_SCENARIOS) {
  test(`${scenario} readings stay within the documented scenario ranges`, () => {
    const range = SCENARIOS[scenario].range;
    const readings = generateReadingsForScenario(scenario);
    for (const r of readings) {
      assert.ok(r.rainfall_1h >= range.rainfall_1h[0] && r.rainfall_1h <= range.rainfall_1h[1]);
      assert.ok(r.rainfall_6h >= range.rainfall_6h[0] && r.rainfall_6h <= range.rainfall_6h[1]);
      assert.ok(r.rainfall_24h >= range.rainfall_24h[0] && r.rainfall_24h <= range.rainfall_24h[1]);
      assert.ok(r.soil_moisture >= range.soil_moisture[0] && r.soil_moisture <= range.soil_moisture[1]);
    }
  });
}

test("generated points stay near their source terrain cell (small jitter only)", () => {
  const readings = generateReadingsForScenario("HEAVY_RAIN");
  for (const r of readings) {
    const cell = TERRAIN_CELLS.find((c) => c.id === r.cellId)!;
    assert.ok(Math.abs(r.lat - cell.lat) < 0.01);
    assert.ok(Math.abs(r.lon - cell.lon) < 0.01);
  }
});
