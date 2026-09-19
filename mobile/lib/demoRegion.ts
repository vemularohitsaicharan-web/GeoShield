/**
 * Demo region for the GeoShield-NER prototype (Phase 3, repaired).
 *
 * Region: Sohra (Cherrapunji) / East Khasi Hills, Meghalaya.
 * Chosen because it is a real, well-known landslide-prone area on the
 * southern Khasi Hills escarpment with heavy monsoon rainfall and a
 * documented history of slope failures affecting the Shillong-Sohra
 * road corridor.
 *
 * IMPORTANT — data provenance (see docs/data-sources.md):
 * Elevation/slope values below are illustrative, order-of-magnitude
 * accurate for this escarpment (real elevations here range roughly
 * 900-1500m with slopes up to 40-50 degrees near the edge), but were
 * NOT pulled from a live DEM in this environment. Historical landslide
 * points are illustrative placeholders for known-affected stretches of
 * the Shillong-Sohra road, not a verified GSI/Bhukosh export. Before a
 * real deployment or a claim of dataset accuracy to judges, replace
 * these with an actual SRTM/Copernicus DEM extract and a GSI/NRSC
 * landslide inventory export for this bounding box, as documented in
 * docs/data-sources.md.
 */
import { HistoricalLandslide, RoadSegment, TerrainCell, Village } from "./types";

export const DEMO_REGION = {
  name: "Sohra (Cherrapunji) — East Khasi Hills, Meghalaya",
  bbox: {
    minLat: 25.15,
    maxLat: 25.35,
    minLon: 91.55,
    maxLon: 91.85,
  },
};

export const TERRAIN_CELLS: TerrainCell[] = [
  { id: "cell-sohra", name: "Sohra (Cherrapunji)", lat: 25.2841, lon: 91.7273, elevation_m: 1484, slope_degrees: 22 },
  { id: "cell-mawsynram", name: "Mawsynram", lat: 25.2967, lon: 91.5822, elevation_m: 1400, slope_degrees: 18 },
  { id: "cell-mawkdok", name: "Mawkdok Dympep Valley", lat: 25.3475, lon: 91.7124, elevation_m: 1290, slope_degrees: 38 },
  { id: "cell-laitkynsew", name: "Laitkynsew", lat: 25.2417, lon: 91.6858, elevation_m: 1220, slope_degrees: 31 },
  { id: "cell-nongriat", name: "Nongriat", lat: 25.2489, lon: 91.6875, elevation_m: 980, slope_degrees: 45 },
  { id: "cell-tyrna", name: "Tyrna", lat: 25.2508, lon: 91.6839, elevation_m: 1050, slope_degrees: 42 },
  { id: "cell-shillong-sohra-mid", name: "Shillong-Sohra Rd (Midpoint)", lat: 25.3608, lon: 91.7180, elevation_m: 1350, slope_degrees: 27 },
  { id: "cell-dwarksuid", name: "Dwarksuid", lat: 25.3122, lon: 91.7502, elevation_m: 1310, slope_degrees: 15 },
];

export const HISTORICAL_LANDSLIDES: HistoricalLandslide[] = [
  { id: "hist-1", lat: 25.3480, lon: 91.7130, year: 2018, note: "Slope failure near Mawkdok viewpoint road stretch (illustrative)" },
  { id: "hist-2", lat: 25.2500, lon: 91.6850, year: 2021, note: "Debris slide on Tyrna-Nongriat trail approach (illustrative)" },
  { id: "hist-3", lat: 25.2420, lon: 91.6870, year: 2022, note: "Road-cut failure near Laitkynsew (illustrative)" },
  { id: "hist-4", lat: 25.3600, lon: 91.7190, year: 2023, note: "Monsoon slope movement, Shillong-Sohra corridor (illustrative)" },
];

export const VILLAGES: Village[] = [
  { id: "vil-sohra", name: "Sohra (Cherrapunji)", lat: 25.2841, lon: 91.7273, population_est: 12000 },
  { id: "vil-mawsynram", name: "Mawsynram", lat: 25.2967, lon: 91.5822, population_est: 8000 },
  { id: "vil-laitkynsew", name: "Laitkynsew", lat: 25.2417, lon: 91.6858, population_est: 1500 },
  { id: "vil-nongriat", name: "Nongriat", lat: 25.2489, lon: 91.6875, population_est: 400 },
];

export const ROADS: RoadSegment[] = [
  {
    id: "road-shillong-sohra",
    name: "Shillong - Sohra Road (NH206 corridor)",
    path: [
      [25.3608, 91.7180],
      [25.3475, 91.7124],
      [25.3122, 91.7502],
      [25.2841, 91.7273],
    ],
  },
];
