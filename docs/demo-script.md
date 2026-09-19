# SIH Demo Script (Phase 10)

Run this once, start to finish, before presenting. Reset demo data (Analytics tab) between rehearsals.

## Setup
1. `cd server && node index.mjs` (leave running)
2. `cd mobile && npx expo start`
3. Scan the QR with Expo Go on a phone on the same Wi-Fi.

## Scenario 1 — Normal conditions → Low risk
- Dashboard tab, role = AUTHORITY.
- Tap **Normal** under Simulator scenario.
- Point out: all 8 monitored zones LOW/MEDIUM, zero active alerts.

## Scenario 2 — Heavy rainfall → Medium/High risk
- Tap **Heavy Rain**.
- Point out: stat cards shift, some zones now MEDIUM/HIGH.
- Open **Risk Map**, tap a zone marker, show the detail panel (score, confidence, rainfall, slope, historical density, model version — this is the explainable `baseline-v1` formula, not a black-box model).

## Scenario 3 — Critical conditions → High/Critical risk + alert
- Tap **Critical**.
- Point out: multiple zones CRITICAL, alert banner appears on Dashboard, entries appear on **Alerts** tab.

## Field report (offline-first)
- Switch role to FIELD_OFFICER on Reports tab.
- Toggle **OFFLINE**.
- Capture GPS location (or let it fall back to the region centroid), describe an observation (e.g. "large crack across the road with rockfall debris"), pick severity HIGH, select observed signs (rockfall, road obstruction), submit.
- Point out: report queues locally as `PENDING_SYNC` — this works with zero connectivity.
- Toggle back **ONLINE**, tap **Sync**.
- Point out: report becomes `SYNCED` with an AI-generated category/summary/confidence attached (Groq if configured, otherwise the deterministic fallback — the app works either way).

## Human verification
- Switch role to AUTHORITY.
- Tap **Verify** on the synced report.

## Alert workflow
- Alerts tab: show the AI-flagged report alert alongside the zone-risk alerts, tap **Acknowledge** on one.

## Analytics
- Show the risk distribution bar chart and the event summary (reports, verified count, alerts raised/resolved) reflecting everything just demonstrated.
- Tap **Reset demo data** before the next run-through or before presenting live.

## Talking points if asked
- **"Is the risk score just an LLM?"** No — `baseline-v1` is a documented deterministic weighted formula (`docs/risk-model.md`); Groq only handles report text (classification/summary), never the numeric score, and the app works even if Groq is down.
- **"Is this trained on real data?"** The geography (Sohra/Cherrapunji, East Khasi Hills) is real and genuinely landslide-prone; the specific terrain/historical point values are illustrative stand-ins for a DEM/GSI export, documented honestly in `docs/data-sources.md` along with exactly what to substitute for a real deployment.
- **"What's next for this to be production-ready?"** Real Supabase/PostGIS backend with RLS (Phase 2 in `docs/development-plan.md`), a real DEM + GSI/NRSC historical dataset, a trained ML layer once enough real incidents exist to validate one, and real device-level offline sync.
