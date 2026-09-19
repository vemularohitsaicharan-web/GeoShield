// One-off seed script: populates terrain_cells, historical_landslides,
// villages, and roads in Supabase from the same reference data used by
// mobile/lib/demoRegion.ts (kept in sync manually — this is demo seed
// data, not application logic).
//
// Uses the Supabase SERVICE ROLE key to bypass RLS for seeding. This key
// must never be placed in mobile/.env (it would ship inside the app
// bundle) — it lives only in server/.env and is read directly by this
// script, which you run manually from a terminal:
//
//   node scripts/seed.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

const env = { ...loadEnvFile(join(__dirname, "../server/.env")), ...process.env };
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env — see server/.env.example.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Mirrors mobile/lib/demoRegion.ts — Sohra (Cherrapunji) / East Khasi Hills, Meghalaya.
const TERRAIN_CELLS = [
  { id: "cell-sohra", name: "Sohra (Cherrapunji)", lat: 25.2841, lon: 91.7273, elevation_m: 1484, slope_degrees: 22 },
  { id: "cell-mawsynram", name: "Mawsynram", lat: 25.2967, lon: 91.5822, elevation_m: 1400, slope_degrees: 18 },
  { id: "cell-mawkdok", name: "Mawkdok Dympep Valley", lat: 25.3475, lon: 91.7124, elevation_m: 1290, slope_degrees: 38 },
  { id: "cell-laitkynsew", name: "Laitkynsew", lat: 25.2417, lon: 91.6858, elevation_m: 1220, slope_degrees: 31 },
  { id: "cell-nongriat", name: "Nongriat", lat: 25.2489, lon: 91.6875, elevation_m: 980, slope_degrees: 45 },
  { id: "cell-tyrna", name: "Tyrna", lat: 25.2508, lon: 91.6839, elevation_m: 1050, slope_degrees: 42 },
  { id: "cell-shillong-sohra-mid", name: "Shillong-Sohra Rd (Midpoint)", lat: 25.3608, lon: 91.7180, elevation_m: 1350, slope_degrees: 27 },
  { id: "cell-dwarksuid", name: "Dwarksuid", lat: 25.3122, lon: 91.7502, elevation_m: 1310, slope_degrees: 15 },
];

const HISTORICAL_LANDSLIDES = [
  { id: "hist-1", lat: 25.3480, lon: 91.7130, year: 2018, note: "Slope failure near Mawkdok viewpoint road stretch (illustrative)" },
  { id: "hist-2", lat: 25.2500, lon: 91.6850, year: 2021, note: "Debris slide on Tyrna-Nongriat trail approach (illustrative)" },
  { id: "hist-3", lat: 25.2420, lon: 91.6870, year: 2022, note: "Road-cut failure near Laitkynsew (illustrative)" },
  { id: "hist-4", lat: 25.3600, lon: 91.7190, year: 2023, note: "Monsoon slope movement, Shillong-Sohra corridor (illustrative)" },
];

const VILLAGES = [
  { id: "vil-sohra", name: "Sohra (Cherrapunji)", lat: 25.2841, lon: 91.7273, population_est: 12000 },
  { id: "vil-mawsynram", name: "Mawsynram", lat: 25.2967, lon: 91.5822, population_est: 8000 },
  { id: "vil-laitkynsew", name: "Laitkynsew", lat: 25.2417, lon: 91.6858, population_est: 1500 },
  { id: "vil-nongriat", name: "Nongriat", lat: 25.2489, lon: 91.6875, population_est: 400 },
];

const ROADS = [
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

async function main() {
  console.log("Seeding terrain_cells...");
  let { error } = await supabase.from("terrain_cells").upsert(
    TERRAIN_CELLS.map((c) => ({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
      elevation_m: c.elevation_m,
      slope_degrees: c.slope_degrees,
    })),
  );
  if (error) throw new Error(`terrain_cells: ${error.message}`);

  console.log("Seeding historical_landslides...");
  ({ error } = await supabase.from("historical_landslides").upsert(
    HISTORICAL_LANDSLIDES.map((h) => ({
      id: h.id,
      lat: h.lat,
      lon: h.lon,
      year: h.year,
      note: h.note,
    })),
  ));
  if (error) throw new Error(`historical_landslides: ${error.message}`);

  console.log("Seeding villages...");
  ({ error } = await supabase.from("villages").upsert(
    VILLAGES.map((v) => ({
      id: v.id,
      name: v.name,
      lat: v.lat,
      lon: v.lon,
      population_est: v.population_est,
    })),
  ));
  if (error) throw new Error(`villages: ${error.message}`);

  console.log("Seeding roads...");
  ({ error } = await supabase.from("roads").upsert(
    ROADS.map((r) => ({
      id: r.id,
      name: r.name,
      path: r.path,
    })),
  ));
  if (error) throw new Error(`roads: ${error.message}`);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
