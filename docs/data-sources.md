# Data Sources (Phase 3)

## Demo region
**Sohra (Cherrapunji) / East Khasi Hills, Meghalaya.** Chosen because it is a real, well-documented landslide-prone escarpment on the southern edge of the Khasi Hills, with extreme monsoon rainfall and a known history of slope failures affecting the Shillong-Sohra road corridor. Bounding box: lat 25.15-25.35, lon 91.55-91.85. Defined in `mobile/lib/demoRegion.ts`.

## What's real vs. illustrative right now

| Data | Status today | Real source to substitute |
|---|---|---|
| Village/place names, general geography | Real place names in the region | — |
| Terrain cell elevation/slope | Illustrative, order-of-magnitude accurate for this escarpment (900-1500m, up to ~45°) | SRTM 30m or Copernicus GLO-30 DEM for this bbox, processed with GDAL/rasterio into per-point elevation + slope |
| Historical landslide points | Illustrative placeholders on known-affected road stretches | GSI/Bhukosh landslide inventory or NRSC/Bhuvan landslide susceptibility export for this bbox |
| Rainfall scenario ranges (Normal/Heavy/Critical) | Order-of-magnitude realistic for this monsoon climate, not station-calibrated | IMD climatological normals / station data for Sohra (one of the wettest places on Earth) |
| Environmental readings (rainfall, soil moisture, temperature) | Fully synthetic, generated per scenario | Real IoT sensor ingestion (future work — the pipeline is already shaped to accept it) |

**Do not present the illustrative terrain/historical data to judges as a verified real dataset.** Present it honestly as: "real geography and known-affected corridor, illustrative point values standing in for a DEM/GSI export we'd wire in next."

## Why this matters
The Phase 4 risk model consumes `slope_degrees`, `elevation_m`, and `historical_landslide_density` directly from this data. Swapping in the real DEM/GSI datasets later requires no code changes to the risk engine — only replacing the contents of `mobile/lib/demoRegion.ts`.
