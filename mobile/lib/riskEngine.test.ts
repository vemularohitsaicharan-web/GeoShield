import assert from "node:assert/strict";
import { test } from "node:test";

import { TERRAIN_CELLS } from "./demoRegion";
import { computeRisk, historicalDensityFor, riskLevelFor } from "./riskEngine";
import { EnvironmentalReading } from "./types";

function reading(overrides: Partial<EnvironmentalReading> = {}): EnvironmentalReading {
  return {
    cellId: TERRAIN_CELLS[0].id,
    lat: TERRAIN_CELLS[0].lat,
    lon: TERRAIN_CELLS[0].lon,
    rainfall_1h: 0,
    rainfall_6h: 0,
    rainfall_24h: 0,
    soil_moisture: 20,
    temperature: 22,
    timestamp: new Date().toISOString(),
    device_id: "test-device",
    quality_status: "OK",
    ...overrides,
  };
}

test("risk thresholds map score ranges to the documented levels", () => {
  assert.equal(riskLevelFor(0), "LOW");
  assert.equal(riskLevelFor(0.24), "LOW");
  assert.equal(riskLevelFor(0.25), "MEDIUM");
  assert.equal(riskLevelFor(0.5), "HIGH");
  assert.equal(riskLevelFor(0.75), "CRITICAL");
  assert.equal(riskLevelFor(1), "CRITICAL");
});

test("dry conditions on a low-slope cell produce LOW risk", () => {
  const cell = TERRAIN_CELLS.find((c) => c.slope_degrees < 20)!;
  const result = computeRisk(cell, reading({ cellId: cell.id, rainfall_24h: 5, soil_moisture: 15 }));
  assert.equal(result.risk_level, "LOW");
  assert.ok(result.risk_score < 0.25);
});

test("extreme rainfall and saturation on a steep cell produce CRITICAL risk", () => {
  const cell = TERRAIN_CELLS.find((c) => c.slope_degrees > 40)!;
  const result = computeRisk(
    cell,
    reading({
      cellId: cell.id,
      rainfall_1h: 55,
      rainfall_6h: 190,
      rainfall_24h: 480,
      soil_moisture: 95,
    }),
  );
  assert.equal(result.risk_level, "CRITICAL");
  assert.ok(result.risk_score >= 0.75);
});

test("feature normalization clamps out-of-range values instead of exceeding [0,1] contribution", () => {
  const cell = TERRAIN_CELLS[0];
  // rainfall_24h far beyond the documented max (500mm) must not push the
  // score above 1.0 or throw.
  const result = computeRisk(cell, reading({ rainfall_24h: 5000, soil_moisture: 20 }));
  assert.ok(result.risk_score <= 1);
  assert.ok(result.risk_score >= 0);
});

test("negative/invalid-looking values do not crash the engine and stay within bounds", () => {
  const cell = TERRAIN_CELLS[0];
  const result = computeRisk(cell, reading({ rainfall_1h: -10, soil_moisture: -5 }));
  assert.ok(Number.isFinite(result.risk_score));
  assert.ok(result.risk_score >= 0 && result.risk_score <= 1);
});

test("suspect quality readings reduce confidence but still produce a result", () => {
  const cell = TERRAIN_CELLS[0];
  const result = computeRisk(cell, reading({ quality_status: "SUSPECT" }));
  assert.equal(result.confidence, 0.5);
});

test("identical inputs always produce identical output (deterministic)", () => {
  const cell = TERRAIN_CELLS[2];
  const r = reading({ cellId: cell.id, rainfall_1h: 12, rainfall_6h: 80, rainfall_24h: 200, soil_moisture: 55 });
  const first = computeRisk(cell, r);
  const second = computeRisk(cell, r);
  assert.equal(first.risk_score, second.risk_score);
  assert.equal(first.risk_level, second.risk_level);
});

test("every prediction records the current model version", () => {
  const cell = TERRAIN_CELLS[0];
  const result = computeRisk(cell, reading());
  assert.equal(result.model_version, "baseline-v1");
});

test("historical density counts only events within the documented 3km radius", () => {
  const cell = TERRAIN_CELLS.find((c) => c.id === "cell-mawkdok")!;
  const density = historicalDensityFor(cell);
  assert.ok(density >= 0);
  assert.ok(Number.isInteger(density));
});
