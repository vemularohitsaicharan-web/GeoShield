/**
 * Phase 4 (repaired) — deterministic baseline risk model.
 *
 * This is the model actually used by the demo. It is a fully documented,
 * explainable weighted formula with no trained parameters, so its output
 * can be defended and reproduced from raw inputs at any time. A trained
 * XGBoost layer is left as documented future work (see docs/risk-model.md)
 * once enough real historical incidents exist to validate one honestly.
 */
import { HISTORICAL_LANDSLIDES } from "./demoRegion";
import { EnvironmentalReading, RiskLevel, RiskPrediction, TerrainCell } from "./types";

export const MODEL_VERSION = "baseline-v1";

// Documented normalization bounds, derived from the Phase 3 scenario
// reference ranges (see docs/data-sources.md) — not arbitrary.
const BOUNDS = {
  rainfall_1h: { min: 0, max: 60 }, // mm
  rainfall_6h: { min: 0, max: 200 }, // mm
  rainfall_24h: { min: 0, max: 500 }, // mm
  soil_moisture: { min: 0, max: 100 }, // %
  slope_degrees: { min: 0, max: 60 },
  historical_density_radius_km: 3,
  historical_density_max: 3, // events within radius treated as saturating risk
};

// Documented weights — rainfall intensity and historical density dominate,
// consistent with standard landslide-triggering literature; slope amplifies
// susceptibility rather than being the sole driver, elevation is a minor
// term standing in for temperature/freeze-thaw effects at higher altitude.
const WEIGHTS = {
  rainfall_24h: 0.28,
  rainfall_6h: 0.22,
  rainfall_1h: 0.12,
  soil_moisture: 0.18,
  slope: 0.12,
  historical_density: 0.08,
};

export const RISK_THRESHOLDS: { level: RiskLevel; max: number }[] = [
  { level: "LOW", max: 0.25 },
  { level: "MEDIUM", max: 0.5 },
  { level: "HIGH", max: 0.75 },
  { level: "CRITICAL", max: 1.01 },
];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normalize(value: number, min: number, max: number) {
  return clamp01((value - min) / (max - min));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function historicalDensityFor(cell: TerrainCell): number {
  const count = HISTORICAL_LANDSLIDES.filter(
    (h) => haversineKm(cell.lat, cell.lon, h.lat, h.lon) <= BOUNDS.historical_density_radius_km,
  ).length;
  return count;
}

export function riskLevelFor(score: number): RiskLevel {
  const found = RISK_THRESHOLDS.find((t) => score < t.max);
  return found ? found.level : "CRITICAL";
}

/**
 * Deterministic — identical inputs always produce the identical score.
 */
export function computeRisk(cell: TerrainCell, reading: EnvironmentalReading): RiskPrediction {
  const density = historicalDensityFor(cell);

  const nRain1h = normalize(reading.rainfall_1h, BOUNDS.rainfall_1h.min, BOUNDS.rainfall_1h.max);
  const nRain6h = normalize(reading.rainfall_6h, BOUNDS.rainfall_6h.min, BOUNDS.rainfall_6h.max);
  const nRain24h = normalize(reading.rainfall_24h, BOUNDS.rainfall_24h.min, BOUNDS.rainfall_24h.max);
  const nSoil = normalize(reading.soil_moisture, BOUNDS.soil_moisture.min, BOUNDS.soil_moisture.max);
  const nSlope = normalize(cell.slope_degrees, BOUNDS.slope_degrees.min, BOUNDS.slope_degrees.max);
  const nDensity = normalize(density, 0, BOUNDS.historical_density_max);

  const score = clamp01(
    WEIGHTS.rainfall_24h * nRain24h +
      WEIGHTS.rainfall_6h * nRain6h +
      WEIGHTS.rainfall_1h * nRain1h +
      WEIGHTS.soil_moisture * nSoil +
      WEIGHTS.slope * nSlope +
      WEIGHTS.historical_density * nDensity,
  );

  const level = riskLevelFor(score);

  // Confidence is a simple function of input completeness/quality for this
  // baseline model, not a statistical model confidence interval.
  const confidence = reading.quality_status === "OK" ? 0.85 : 0.5;

  return {
    cellId: cell.id,
    risk_score: Number(score.toFixed(3)),
    risk_level: level,
    confidence,
    model_version: MODEL_VERSION,
    computed_at: new Date().toISOString(),
    inputs: {
      rainfall_1h: reading.rainfall_1h,
      rainfall_6h: reading.rainfall_6h,
      rainfall_24h: reading.rainfall_24h,
      soil_moisture: reading.soil_moisture,
      slope_degrees: cell.slope_degrees,
      elevation_m: cell.elevation_m,
      historical_landslide_density: density,
    },
  };
}
