/**
 * Phase 3 (repaired) — scenario-driven environmental data simulator.
 *
 * Value ranges are bounded to the same documented rainfall reference
 * ranges used by the risk engine's normalization bounds (see
 * docs/data-sources.md for what real IMD/ground-station data should
 * eventually replace these with).
 */
import { TERRAIN_CELLS } from "./demoRegion";
import { EnvironmentalReading, ScenarioId, TerrainCell } from "./types";

interface ScenarioRange {
  rainfall_1h: [number, number];
  rainfall_6h: [number, number];
  rainfall_24h: [number, number];
  soil_moisture: [number, number];
  temperature: [number, number];
}

export const SCENARIOS: Record<ScenarioId, { label: string; description: string; range: ScenarioRange }> = {
  NORMAL: {
    label: "Normal",
    description: "Dry-to-light conditions, low ground saturation.",
    range: {
      rainfall_1h: [0, 4],
      rainfall_6h: [0, 15],
      rainfall_24h: [0, 40],
      soil_moisture: [15, 40],
      temperature: [18, 26],
    },
  },
  HEAVY_RAIN: {
    label: "Heavy Rain",
    description: "Sustained monsoon rainfall, rising saturation.",
    range: {
      rainfall_1h: [10, 30],
      rainfall_6h: [60, 140],
      rainfall_24h: [150, 320],
      soil_moisture: [45, 75],
      temperature: [16, 22],
    },
  },
  CRITICAL_LANDSLIDE_RISK: {
    label: "Critical",
    description: "Extreme cloudburst-scale rainfall on saturated ground.",
    range: {
      rainfall_1h: [35, 60],
      rainfall_6h: [150, 200],
      rainfall_24h: [350, 500],
      soil_moisture: [80, 100],
      temperature: [15, 20],
    },
  },
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function jitterLatLon(cell: TerrainCell) {
  // Small jitter so the "device" location isn't pinned exactly on the
  // village centroid, standing in for a real sensor's actual placement.
  return {
    lat: cell.lat + rand(-0.002, 0.002),
    lon: cell.lon + rand(-0.002, 0.002),
  };
}

export function generateReadingsForScenario(
  scenario: ScenarioId,
  cells: TerrainCell[] = TERRAIN_CELLS,
): EnvironmentalReading[] {
  const range = SCENARIOS[scenario].range;
  const now = new Date().toISOString();

  return cells.map((cell) => {
    const { lat, lon } = jitterLatLon(cell);
    return {
      cellId: cell.id,
      lat,
      lon,
      rainfall_1h: Number(rand(...range.rainfall_1h).toFixed(1)),
      rainfall_6h: Number(rand(...range.rainfall_6h).toFixed(1)),
      rainfall_24h: Number(rand(...range.rainfall_24h).toFixed(1)),
      soil_moisture: Number(rand(...range.soil_moisture).toFixed(1)),
      temperature: Number(rand(...range.temperature).toFixed(1)),
      timestamp: now,
      device_id: `sim-${cell.id}`,
      quality_status: Math.random() > 0.05 ? "OK" : "SUSPECT",
    };
  });
}
