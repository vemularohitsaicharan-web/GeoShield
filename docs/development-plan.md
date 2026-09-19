# GeoShield-NER — Claude Code Phase-Wise Development Plan

**AI-Powered Landslide Risk Monitoring & Early Warning — North Eastern Region of India**

> **PROTOTYPE | Software-only.** No ESP32 or physical sensors are required. Environmental sensor streams are simulated in software and can later be replaced by real IoT ingestion.

**Purpose.** This document is a copy-ready implementation brief for Claude Code. Use the phases sequentially. Complete and verify one phase before moving to the next.

**Source alignment.** The plan follows the submitted SIH concept: environmental/historical data, validation, ML risk scoring, GIS visualization, geo-tagged field reports, alerts, offline-first reporting, and human verification.

---

## ⏰ Time-Critical Notice

This plan was authored for the **full 11-phase vision**. If you are building against a hard same-day deadline, executing all 11 phases end-to-end (real Supabase schema + RLS + PostGIS + trained ML model + real offline sync + Groq) is **not achievable from an empty repo in a few hours.** See **[Section 8 — Today's Crunch Track](#8-todays-crunch-track-time-boxed)** for a re-scoped subset that still tells the full end-to-end story live, without the pieces that take too long to get *reliably* working under time pressure. Use the full plan below as the target architecture and as the roadmap you narrate for "how this scales beyond the prototype."

**Status: the Section 8 crunch track has been built** as a React Native / Expo app (chosen over a web dashboard so the deliverable is a real mobile app judges can run on a phone via Expo Go). See [`README.md`](../README.md) at the repo root for how to run it and the live demo script. The full plan below (Phases 0-10) still describes the target architecture if this project continues past the hackathon deadline — the initial mobile build follows Phases 0/1/3/4/6/7/8's intent but with Supabase/PostGIS/trained-ML/real-offline-sync deliberately deferred, per Section 8.

---

## 1. Target Architecture

| Layer | Technology / responsibility |
|---|---|
| Frontend | React Native + Expo (Expo Router) + TypeScript + react-native-maps |
| Backend | Supabase Auth + PostgreSQL + PostGIS + Storage + Realtime + Edge Functions |
| ML | Python + Pandas + scikit-learn + XGBoost |
| AI | Groq API for report analysis, explanations, summaries and responder assistance |
| Offline | PWA + Service Worker + IndexedDB |
| Data simulation | Python simulator for rainfall, soil moisture and environmental observations, anchored to real terrain/historical data |
| Source control | Git + GitHub |
| Deployment | Free-tier-first hosting; verify current service limits before deployment |
| Development agent | Claude Code |

## 2. Architecture Rules

1. Supabase is the primary backend and system of record.
2. PostgreSQL/PostGIS stores structured and geographic data.
3. React is the main dashboard and field-reporting interface.
4. The numerical landslide risk score must not depend on an LLM.
5. XGBoost/scikit-learn (or, when data is insufficient, a documented deterministic rule-based scorer) is used for numerical risk prediction; Groq is used for language/AI assistance only.
6. The application must continue working if Groq is unavailable.
7. Field reporting must be offline-first.
8. Simulated sensor data must be replaceable by real sensor ingestion later.
9. Never expose Groq API keys, Supabase service-role keys, or other secrets in the browser.
10. Use database migrations for schema changes and Row Level Security for protected data.
11. Store `model_version` with every model prediction.
12. Do not implement future phases early.
13. At the end of each phase: show changed files, run verification, document problems, provide exact verification commands, and STOP.

## 3. End-to-End Demo Goal

The final prototype must demonstrate:

1. Simulated environmental data arrives.
2. Data is stored and validated.
3. Risk is calculated with the ML/risk engine.
4. Risk appears on the GIS map.
5. A field officer submits a geo-tagged report, including offline operation.
6. Groq analyzes/summarizes the report.
7. An authorized authority verifies the report.
8. A risk-based alert is created and surfaced in the dashboard.
9. Historical analytics reflect the event.

## 4. Claude Code Prompts — Copy in Order

Use the following prompts one at a time. Do not paste the entire document into Claude Code in one go. Start with the Master Context, then complete Phases 0–10 sequentially.

### PHASE 0 — Master Context / Bootstrap

```
You are the lead software architect and senior full-stack engineer for a Smart India Hackathon 2026 project called "GeoShield-NER".

PROJECT PURPOSE:
GeoShield-NER is a software-based AI-powered landslide risk monitoring and early warning platform for the North Eastern Region of India.

IMPORTANT:
This is currently a SOFTWARE-ONLY prototype.
There are NO ESP32 devices, physical sensors, or IoT hardware available.
Therefore:
- Use simulated environmental sensor data.
- Use historical/public datasets where practical.
- Keep all interfaces modular so real sensors can be connected later.
- Do not make hardware a dependency for any feature.

CORE FLOW:
Environmental / historical data -> Data validation -> Feature engineering -> Landslide risk engine -> GIS risk visualization -> Geo-tagged field reports -> AI-assisted analysis -> Human verification -> Risk-based alerts

TECHNOLOGY STACK:
Frontend: React, Vite, TypeScript, Tailwind CSS, Leaflet
Backend: Supabase, PostgreSQL, PostGIS, Auth, Storage, Realtime, Edge Functions
AI: Groq API
ML: Python, Pandas, scikit-learn, XGBoost
Offline: PWA, Service Worker, IndexedDB
Development: Claude Code, Git, GitHub

ARCHITECTURE RULES:
1. Supabase is the primary backend and system of record.
2. PostgreSQL/PostGIS stores structured and geographic information.
3. React is the main user interface.
4. Leaflet is the GIS map library.
5. The actual numerical risk score must not depend on an LLM.
6. Groq is used for explanation, classification, summarization, report analysis and AI assistance.
7. The application must continue to function if Groq is unavailable.
8. Field reporting must be designed for offline-first operation.
9. Simulated sensor data must be replaceable by real sensors later.
10. All secrets must remain server-side.
11. Never expose GROQ_API_KEY in React/browser code.
12. Use Row Level Security for Supabase tables.
13. Use database migrations for schema changes.
14. Store model_version for every prediction.
15. Never silently discard historical reports or predictions.
16. Keep the project modular and easy to extend.

INITIAL USER ROLES:
ADMIN
AUTHORITY
FIELD_OFFICER
ANALYST
VIEWER

INITIAL MODULES:
1. Authentication
2. Authority dashboard
3. GIS risk map
4. Environmental data monitoring
5. Risk prediction
6. Field reporting
7. Offline reporting
8. AI-assisted report analysis
9. Alert management
10. Historical analytics
11. Data simulation
12. Model/version management

MAIN DEMO SCENARIO:
1. Simulated rainfall/soil/environmental data arrives.
2. Data is stored in Supabase.
3. Risk is calculated.
4. Risk appears on GIS map.
5. A field officer submits a geo-tagged report.
6. Groq analyzes the report.
7. Authority verifies the report.
8. A high-risk alert is created.
9. Authority dashboard updates.
10. Historical analytics show the event.

ENGINEERING STANDARDS:
- TypeScript strict mode.
- Reusable components.
- Clear folder structure.
- Environment variables for secrets.
- Proper loading/error/empty states.
- Validation for all user input.
- Proper error handling.
- Accessible UI.
- Responsive UI.
- Clean naming conventions.
- No unnecessary dependencies.
- No paid services unless explicitly approved.

PROJECT DEVELOPMENT RULE:
Develop the project PHASE BY PHASE.
Do NOT implement future phases early.
At the end of every phase:
1. List files created/modified.
2. Explain what was implemented.
3. Run relevant tests/checks.
4. Report problems.
5. Give exact verification commands.
6. STOP and wait for the next phase instruction.

Before writing substantial code:
- Inspect the current project.
- Create/update CLAUDE.md.
- Create docs/architecture.md.
- Create docs/development-plan.md.
- Do not overwrite existing user files without inspection.

Start with PHASE 0 only.
```

### PHASE 1 — React Application Foundation

```
PHASE 1 — REACT NATIVE (EXPO) APPLICATION FOUNDATION
Implement ONLY Phase 1.
Build the initial React Native application.

Technology:
- React Native
- Expo (managed workflow)
- Expo Router (file-based routing, tab navigator)
- TypeScript
- react-native-maps (for Phase 5)

Create tabs/screens:
dashboard
risk-map
reports
alerts
analytics

For now, pages can use mock data.

Create reusable components:
- Sidebar
- Header
- PageContainer
- StatCard
- RiskBadge
- LoadingState
- EmptyState
- ErrorState
- MapContainer

Create the initial GeoShield-NER visual identity.

Dashboard should contain:
- Total monitored zones
- High-risk zones
- Medium-risk zones
- Active alerts
- Recent field reports
- Risk summary

Do NOT connect Supabase yet.
Do NOT implement Groq.
Do NOT implement the ML engine.
Make the application responsive.
Use clean TypeScript types.

Run:
- npm install if needed
- npm run build
- npm run lint if configured

STOP after completing Phase 1.
```

### PHASE 2 — Supabase Database + Authentication

```
PHASE 2 — SUPABASE DATABASE + AUTHENTICATION
Implement ONLY Phase 2.
Connect the application to Supabase.

Create migrations for these tables:
profiles
sensor_devices
sensor_readings
historical_landslides
terrain_cells
risk_predictions
villages
roads
infrastructure
field_reports
field_report_ai
alerts
alert_recipients
model_versions
notification_tokens
audit_logs

Enable PostGIS.

Use geographic types for:
- sensor locations
- historical landslides
- field reports
- villages
- roads
- infrastructure
- terrain/risk cells

Create indexes for:
- timestamps
- risk level
- geographic queries (GiST indexes on all geometry columns)
- foreign keys

Create roles:
ADMIN
AUTHORITY
FIELD_OFFICER
ANALYST
VIEWER

Implement Supabase Auth.

Create Row Level Security policies:
- Users can read/update only what their role permits.
- Field officers can create their own field reports.
- Authorities can review and verify reports.
- Admins can manage system configuration.
- Public users must not access internal operational data.

Create seed data for development:
- sample users
- sample villages
- sample terrain cells
- sample historical landslides
- sample roads
- sample infrastructure

Do not implement ML yet.
Do not implement Groq yet.
Run migrations and verify the schema.

At the end provide:
- database diagram
- table descriptions
- RLS summary
- exact setup commands

STOP.
```

### PHASE 3 — Environmental Data Simulator *(repaired)*

> **What changed vs. the original draft:** the simulator previously generated rainfall/soil/environment readings with no grounding in real terrain or real landslide history, which leaves the "risk model" indefensible under questioning ("is this trained/tuned on anything real?"). This version anchors the simulator to a **named demo region** and **real reference datasets** for terrain and historical events, and keeps only the time-series (rainfall/soil/temperature) as synthetic, clearly labeled as such.

```
PHASE 3 — SOFTWARE ENVIRONMENTAL DATA SIMULATOR (DATA-GROUNDED)
Implement ONLY Phase 3.
There is NO physical ESP32 or IoT hardware.

STEP 0 — CHOOSE AND DOCUMENT A DEMO REGION
Pick one small, real, landslide-prone area within the North Eastern Region
(e.g. a district or a cluster of villages — for example East Khasi Hills /
Sohra (Meghalaya), or Aizawl district (Mizoram), or a Sikkim district
affected by known landslide events). Record the chosen region, its
approximate bounding box (lat/lon), and the reasoning in
docs/demo-region.md. Do NOT hardcode a region without writing this file —
the rest of the pipeline depends on it.

STEP 1 — SOURCE REAL REFERENCE DATA FOR THAT REGION
Before generating anything synthetic, gather (or, if a live download is not
possible in this environment, produce a clearly labeled realistic stand-in
and document exactly what real dataset it should be replaced with):

- Terrain: elevation and slope for the demo region, derived from a public
  DEM (e.g. SRTM 30m or Copernicus GLO-30, obtainable via OpenTopography or
  similar). Process with GDAL/rasterio into a small grid of terrain_cells
  (lat, lon, elevation_m, slope_degrees).
- Historical landslide events: point locations and approximate dates for
  the demo region, referenced from a public source such as GSI/Bhukosh's
  landslide inventory or NRSC/Bhuvan landslide susceptibility data.
  Represent as a small historical_landslides seed table.
- Rainfall reference ranges: realistic min/typical/extreme 1h/6h/24h
  rainfall values for the region's climate (e.g. from IMD climatological
  normals), used ONLY to bound the ranges the simulator generates — not
  fabricated arbitrarily.

Document every source, its access method, and its license/attribution in
docs/data-sources.md. If a dataset cannot be fetched in this environment,
still write the file describing exactly what to download and where, plus
the fallback values used in its place, so a teammate can swap in the real
file later without code changes.

STEP 2 — BUILD THE SIMULATOR ON TOP OF STEP 1
Create:
ml/simulator/
Files:
rainfall_generator.py
soil_moisture_generator.py
environment_generator.py
scenario_generator.py
upload_to_supabase.py

Generate realistic environmental observations containing:
- latitude
- longitude
- rainfall_1h
- rainfall_6h
- rainfall_24h
- soil_moisture
- temperature
- timestamp
- device_id
- quality_status

Every generated reading's (latitude, longitude) must fall within the demo
region's bounding box and correspond to a real terrain_cell from Step 1 —
do not generate points floating disconnected from the terrain/historical
seed data.

Create scenarios, each with documented value ranges derived from Step 1's
rainfall reference ranges (not arbitrary numbers):
1. NORMAL
2. HEAVY_RAIN
3. CRITICAL_LANDSLIDE_RISK

Support:
python scenario_generator.py --scenario normal
python scenario_generator.py --scenario heavy
python scenario_generator.py --scenario critical

Create a continuous simulation mode.
Use environment variables for credentials.
Add validation for generated values against the documented ranges.
Add tests for local generation, Supabase insertion, and invalid data.
Document clearly, in code comments and docs/data-sources.md, which fields
are real/derived-from-real-sources (terrain, historical density) and which
are synthetic time series standing in for future IoT sensor data.

STOP.
```

### PHASE 4 — Landslide Risk Engine *(repaired)*

> **What changed vs. the original draft:** the original phase asked for a full XGBoost train/test pipeline, but a from-scratch prototype will not have enough real labeled historical incidents to train or validate a model that can survive a judge asking "what's your accuracy on held-out data?" This version makes the **documented deterministic baseline model the actual scorer used in the demo**, and reframes the ML training pipeline as an explicit, clearly-labeled **future-work layer** that becomes viable once more real incidents are collected — so nothing you present overclaims what the data supports.

```
PHASE 4 — LANDSLIDE RISK ENGINE (DETERMINISTIC BASELINE FIRST)
Implement ONLY Phase 4.
The numerical landslide risk score must NOT depend on an LLM.

LAYER 1 — BASELINE RISK MODEL (this is the model used in the demo)
Use:
- rainfall_1h
- rainfall_6h
- rainfall_24h
- soil_moisture
- slope (from terrain_cells, Phase 3)
- elevation (from terrain_cells, Phase 3)
- historical_landslide_density (computed as a count/density of
  historical_landslides within a radius of each terrain_cell, from the
  Phase 3 seed data)

Normalize each feature to 0–1 using documented min/max bounds (derived
from the Phase 3 reference ranges, not arbitrary).

Combine into a single risk_score using an explicit, documented weighted
formula (e.g. a weighted sum or weighted geometric mean of the normalized
features, with weights chosen to reflect that rainfall intensity and
historical density dominate over elevation). Write the exact formula and
every weight, with a one-line justification for each weight, into
docs/risk-model.md. This is the numeric core of the system — it must be
fully explainable to a judge in one paragraph, deterministic, and
reproducible from raw inputs without any trained parameters.

Produce:
risk_score: 0.0 to 1.0
risk_level:
LOW
MEDIUM
HIGH
CRITICAL

Use clearly documented thresholds (e.g. LOW < 0.25, MEDIUM < 0.5, HIGH <
0.75, CRITICAL >= 0.75) written into docs/risk-model.md alongside the
formula.

Store model_version = "baseline-v1" (or similar) with every prediction.

LAYER 2 — ML TRAINING PIPELINE (documented as future work, not required
for the demo to function)
Create the scaffolding only:
ml/training/
ml/preprocessing/
ml/evaluation/

Implement:
- dataset loading (from historical_landslides + associated environmental
  readings)
- preprocessing
- train/test split
- XGBoost training
- evaluation
- feature importance
- model versioning
- model export

Create:
model_metrics.json
model_metadata.json

Store:
model_version
training_date
features
metrics
dataset_version

IMPORTANT:
- The baseline model (Layer 1) remains the production/demo scorer
  regardless of whether Layer 2 runs, because there is not yet enough
  real historical incident data in this prototype to trust a trained
  model's evaluation metrics.
- Do not attempt to run a large XGBoost training workflow inside Supabase
  Edge Functions. Training remains in Python, offline, and its output
  (if any) is presented explicitly as a research/future-work artifact,
  not as what powers the live demo.
- In docs/risk-model.md, write one clear paragraph on the path from
  Layer 1 (now) to Layer 2 (once more real incident data is collected)
  so the roadmap is explicit and honest.

Add unit tests for:
- feature normalization
- risk thresholds
- invalid values
- deterministic results (same input always produces the same score)

STOP.
```

### PHASE 5 — GIS Risk Visualization

```
PHASE 5 — GIS RISK MAP
Implement ONLY Phase 5.
Connect the app to Supabase/PostGIS and build the real GIS dashboard.

Use:
- react-native-maps (native MapView, Marker, Polyline, Circle)
- a web fallback list view for any web-preview build target (native maps do not render reliably on web)
- PostGIS

Implement layers:
1. Risk zones
2. Historical landslides
3. Villages
4. Roads
5. Infrastructure
6. Field reports
7. Environmental observation points

Risk visualization:
LOW -> green
MEDIUM -> yellow/orange
HIGH -> red
CRITICAL -> dark red

Clicking a risk zone must show:
- risk score
- risk level
- confidence
- last updated time
- rainfall
- soil moisture
- slope
- historical event count
- model version

Implement map viewport-based data loading.
Do not load the entire database into the browser.

Add filters:
- risk level
- date
- village
- road
- historical events

Add map legend.
Add loading and error states.

STOP.
```

### PHASE 6 — Field Reporting + Offline Mode

```
PHASE 6 — FIELD REPORTING + OFFLINE FIRST
Implement ONLY Phase 6.
Build the field officer reporting workflow.

Report fields:
- GPS location
- description
- severity
- observed signs
- photo
- timestamp
- reporter

Observed signs:
- ground cracks
- soil movement
- rockfall
- mud accumulation
- road obstruction
- drainage blockage
- unusual water flow
- other

Implement photo upload using Supabase Storage.

Implement:
- PWA
- Service Worker
- IndexedDB
- local report queue

When offline:
- allow report creation
- store report locally (with a client-generated UUID assigned at creation
  time, so later sync is idempotent)
- show offline indicator
- show pending sync count

When connection returns:
- synchronize pending reports using the client-generated UUID to avoid
  duplicates
- mark sync status

Statuses:
DRAFT
PENDING_SYNC
SYNCED
UNDER_REVIEW
VERIFIED
REJECTED

Add authority verification workflow.
Field officer: CREATE -> SUBMIT
Authority: REVIEW -> VERIFY/REJECT

STOP.
```

### PHASE 7 — Groq AI Integration

```
PHASE 7 — GROQ AI INTEGRATION
Implement ONLY Phase 7.
Integrate Groq through a secure server-side interface.
Never expose GROQ_API_KEY to the browser.
Use Supabase Edge Functions or another secure server-side boundary.

Implement:

1. FIELD REPORT CLASSIFICATION
Input: field report text
Output JSON:
{
  "category": "...",
  "severity": "...",
  "signals": [],
  "summary": "...",
  "confidence": 0.0
}

2. RISK EXPLANATION
Input: structured risk prediction
Output: human-readable explanation based only on supplied facts.

3. REPORT SUMMARIZATION
Summarize multiple field reports.

4. ALERT MESSAGE DRAFTING
Create concise alert text for authorized responders.

5. RESPONDER ASSISTANT
Allow authorities to ask natural-language questions about available
system data.

SECURITY RULES:
- Do not allow Groq to directly execute arbitrary SQL.
- Do not expose database credentials.
- Use controlled backend functions.
- Validate structured AI output.
- Store AI model name and timestamp.
- Handle Groq failures gracefully.
- Implement deterministic fallback when Groq is unavailable.
- Handle rate-limit responses.

Groq must NEVER be responsible for the core numerical landslide
prediction.

STOP.
```

### PHASE 8 — Alert System

```
PHASE 8 — ALERT SYSTEM
Implement ONLY Phase 8.
Create the risk-based alert engine.

Alert levels:
LOW
MEDIUM
HIGH
CRITICAL

Create configurable thresholds.

Workflow:
Risk prediction -> Threshold evaluation -> Alert created -> Store in
Supabase -> Realtime update -> Authority dashboard -> Notification

Implement:
- alert creation
- alert acknowledgment
- alert status
- alert history
- recipient management

Statuses:
ACTIVE
ACKNOWLEDGED
RESOLVED
EXPIRED

Use Supabase Realtime for dashboard updates.
Design notification support so Web Push/FCM can be added without
changing the alert engine.
Do not make SMS a dependency for the MVP.
The application must continue working if external notification delivery
fails.

STOP.
```

### PHASE 9 — End-to-End Integration

```
PHASE 9 — END-TO-END INTEGRATION
Implement ONLY Phase 9.
Connect every completed module.

Required end-to-end workflow:
1. Environmental simulator produces data.
2. Data is stored in Supabase.
3. Data validation runs.
4. Features are prepared.
5. Risk score is calculated.
6. Risk prediction is stored.
7. GIS map updates.
8. High-risk condition creates an alert.
9. Authority sees the alert.
10. Field officer creates a geo-tagged report.
11. Report can be created offline.
12. Report synchronizes when online.
13. Groq analyzes the report.
14. Authority reviews AI analysis.
15. Authority verifies the field report.
16. Historical analytics update.

Create an end-to-end DEMO MODE with:
- NORMAL scenario
- HEAVY RAIN scenario
- CRITICAL scenario
- Generate field report
- Trigger high-risk alert
- Reset demo data

The demo must be repeatable.

Add system health indicators:
- Database status
- AI status
- Simulator status
- Last prediction
- Pending offline reports

STOP.
```

### PHASE 10 — Testing, Deployment + SIH Demo

```
PHASE 10 — TESTING + DEPLOYMENT + SIH DEMO
Implement ONLY Phase 10.
Audit the complete GeoShield-NER application.

Run:
1. Frontend tests.
2. Backend/Edge Function tests.
3. ML tests.
4. Simulator tests.
5. Authentication tests.
6. RLS tests.
7. PostGIS query tests.
8. Offline reporting tests.
9. Synchronization tests.
10. Groq failure handling tests.
11. Groq rate-limit handling tests.
12. Alert creation tests.
13. Realtime update tests.
14. Invalid environmental data tests.
15. Duplicate field report tests.
16. Mobile responsiveness tests.

Security audit:
- No secrets in Git.
- No Groq API key in frontend.
- No Supabase service-role key in frontend.
- Verify RLS.
- Validate uploaded files.
- Validate all user inputs.

Performance audit:
- Avoid unnecessary database queries.
- Paginate reports.
- Limit GIS viewport queries.
- Avoid loading large datasets into the browser.
- Cache static data when appropriate.

Create:
docs/deployment.md
docs/demo-script.md
docs/api.md
docs/database.md
docs/security.md

Create an SIH DEMO SCRIPT:
SCENARIO 1: Normal conditions -> Low risk
SCENARIO 2: Heavy rainfall -> Medium/high risk
SCENARIO 3: Critical environmental conditions -> High/Critical risk

Then:
Risk appears on map -> Alert generated -> Field report submitted -> Groq
analyzes report -> Authority verifies report -> Dashboard reflects event

Provide exact deployment instructions.

STOP.
```

## 5. Verification Checklist After Every Phase

- Claude lists the files it created or changed.
- Claude explains what was implemented.
- The relevant build/test/check commands succeed.
- No secrets were added to the repository.
- No future-phase functionality was implemented prematurely.
- The phase can be demonstrated independently.
- The exact next verification commands are documented.
- Claude stops and waits for the next phase.

## 6. Final SIH Demonstration Sequence

| Step | What to demonstrate |
|---|---|
| 1. Normal condition | Run the normal simulator scenario and show low-risk zones on the GIS map. |
| 2. Heavy rainfall | Run the heavy-rain scenario and show risk values changing. |
| 3. Critical condition | Run the critical scenario and show a high/critical risk zone and alert. |
| 4. Field report | Open the field workflow, capture location/photo/description, and submit a report. |
| 5. Offline | Demonstrate creating a report while offline and then syncing it after reconnecting. |
| 6. Groq analysis | Show the AI classification/summary/explanation of the field report. |
| 7. Human verification | Use the authority role to review and verify the report. |
| 8. Alert workflow | Show the alert status and dashboard update. |
| 9. Analytics | Show the event in the historical/analytics view. |

## 7. Notes for the Team

- The current prototype is software-only; the environmental simulator is a deliberate substitute for unavailable hardware.
- Keep interfaces modular so a future ESP32/IoT ingestion service can write into the same `sensor_readings` pipeline.
- Do not allow the LLM to become the sole source of numerical risk decisions.
- The final SIH story should emphasize the end-to-end workflow rather than the number of technologies used.
- Before deployment, verify the current free-tier limits and policies of every third-party service being used.
- The Phase 4 baseline model is the honest, defensible core of the pitch: a fully explainable formula beats an unverifiable "trained" model when you don't yet have enough real incident data.

## 8. Today's Crunch Track (time-boxed)

Use this section instead of Phases 0–10 when there are only a few hours left before the demo. It keeps the same end-to-end story but drops every piece that is unlikely to reach a *reliably working* state under time pressure. Treat the cut items as "future work" talking points in the pitch, not as things to attempt today.

**Cut for today (call these "roadmap" in the pitch):**
- Real Supabase schema, migrations, RLS, and Auth — use in-memory/mock data and a role *switcher* instead of real login.
- Real PostGIS queries — use a small hardcoded/local GeoJSON set for the demo region instead.
- XGBoost training pipeline — use only the Phase 4 deterministic baseline formula.
- Real Service Worker/IndexedDB offline sync — simulate "offline" with a UI toggle and localStorage queue; it tells the same story live without the implementation risk.
- Automated test suite, security/performance audit, deployment docs — skip; note as follow-up.
- SMS/push notifications — already out of scope per Architecture Rule 8's "future work" framing.

**Keep (these are what actually gets judged):**
- React + Vite + Tailwind + Leaflet dashboard and map, wired to mock/local data.
- The Phase 4 documented risk formula, computed client-side (or in one tiny local API route) from scenario input data.
- A scenario switcher (Normal / Heavy Rain / Critical) that swaps the input dataset and recalculates risk live on the map.
- A field report form (location, description, severity, observed signs) with an offline-toggle demo and a "sync" action.
- One real Groq API call (via a minimal server/proxy endpoint, never called directly from the browser with an exposed key) for report classification/summary, with a hardcoded fallback string if the call fails or times out.
- A CRITICAL-risk alert banner and a simple alert list.
- A rehearsed run-through of the Section 6 demo sequence, end to end, at least once before presenting.

**Suggested time budget (adjust to your actual remaining time):**

| Block | Focus |
|---|---|
| 1 | Scaffold app, routes, layout, mock data, map with color-coded demo points |
| 2 | Implement the documented risk formula + scenario switcher recalculating live |
| 3 | Field report form + offline-toggle + localStorage queue + "sync" action |
| 4 | Groq integration via a minimal server proxy, with fallback text on failure |
| 5 | Alert banner/list wired to CRITICAL risk level |
| 6 | Fix build errors, rehearse the full demo sequence twice |

---

*End of GeoShield-NER Claude Code Development Plan.*
