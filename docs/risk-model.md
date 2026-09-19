# Risk Model (Phase 4 — baseline-v1)

This is the model the demo actually uses. It is a fully deterministic, documented weighted formula with no trained parameters — every number here can be recomputed by hand from raw inputs, and the same inputs always produce the same output (see `mobile/lib/riskEngine.ts`).

## Inputs
- `rainfall_1h`, `rainfall_6h`, `rainfall_24h` (mm) — from the environmental reading
- `soil_moisture` (%) — from the environmental reading
- `slope_degrees`, `elevation_m` — from the terrain cell
- `historical_landslide_density` — count of historical landslide points within 3km of the terrain cell

## Normalization bounds
| Feature | Min | Max |
|---|---|---|
| rainfall_1h | 0 | 60 mm |
| rainfall_6h | 0 | 200 mm |
| rainfall_24h | 0 | 500 mm |
| soil_moisture | 0 | 100% |
| slope_degrees | 0 | 60° |
| historical_landslide_density | 0 | 3 events |

Bounds are derived from the Phase 3 scenario reference ranges (see `docs/data-sources.md`), not arbitrary.

## Weights and rationale
| Feature | Weight | Why |
|---|---|---|
| rainfall_24h | 0.28 | Cumulative saturation over a day is the single strongest landslide trigger in monsoon terrain |
| rainfall_6h | 0.22 | Captures intensifying short-term rainfall bursts |
| soil_moisture | 0.18 | Directly reflects ground saturation state, independent of the latest rainfall reading |
| rainfall_1h | 0.12 | Instantaneous intensity — cloudburst signal |
| slope_degrees | 0.12 | Steeper slopes amplify failure likelihood for the same saturation level |
| historical_landslide_density | 0.08 | Prior incidents indicate locally weaker terrain, but as a minor adjustment, not a dominant factor |

Score = weighted sum of normalized features, clamped to [0, 1].

## Thresholds
| risk_level | Score range |
|---|---|
| LOW | < 0.25 |
| MEDIUM | 0.25 - 0.5 |
| HIGH | 0.5 - 0.75 |
| CRITICAL | >= 0.75 |

## Roadmap: baseline-v1 → trained model
This prototype does not yet have enough real, labeled historical incidents to train and honestly validate an XGBoost model — a small hand-picked set of illustrative points cannot support a trustworthy train/test split or accuracy claim. `baseline-v1` is deliberately the production/demo scorer because it is fully explainable and reproducible without that data.

Once a real historical incident dataset (e.g. a GSI/Bhukosh export, Section `docs/data-sources.md`) accumulates enough labeled events for the region, the scaffolding in `ml/training/`, `ml/preprocessing/`, `ml/evaluation/` (Phase 4, Layer 2) becomes viable: train an XGBoost model on real features, evaluate on a held-out split, and only then consider promoting it above baseline-v1 — with `model_version` making it trivial to compare both side by side on the same inputs before switching.
