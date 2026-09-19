# GeoShield-NER — Run Guide

Software-only AI-powered landslide risk monitoring & early warning prototype for the North Eastern Region of India (Smart India Hackathon). React Native / Expo mobile app + a small local Groq proxy server.

See [`docs/development-plan.md`](docs/development-plan.md) for the full phased plan (and Section 8 for the time-boxed crunch scope this build follows), [`docs/risk-model.md`](docs/risk-model.md) for the risk formula, and [`docs/data-sources.md`](docs/data-sources.md) for what's real vs. illustrative in the demo data.

## 1. Start the Groq proxy server

The app never holds the Groq API key directly — this tiny server does, and the app calls it over the local network.

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set `GROQ_API_KEY=<your key>` (get one free at console.groq.com). If you skip this, the app still works — every AI call falls back to a deterministic local analysis, which is architecturally correct (the app must keep working if Groq is unavailable) but less impressive live.

```bash
node index.mjs
```

Leave this running. You should see `GeoShield-NER Groq proxy listening on http://localhost:8787`.

## 2. Start the Expo app

In a second terminal:

```bash
cd mobile
npx expo start
```

This prints a QR code. **Your phone and this computer must be on the same Wi-Fi network.**

- Install **Expo Go** from the Play Store / App Store on your phone.
- Scan the QR code (Android: Expo Go's scanner; iOS: the Camera app).
- The app loads on your phone. The Groq proxy address is auto-detected from the same network Metro is running on — no manual IP configuration needed.

If your phone can't reach the proxy server (e.g. a locked-down campus/venue Wi-Fi that blocks device-to-device traffic), the AI feature will just show the fallback analysis — the rest of the app is unaffected.

## 3. Demo script

Run through this once before presenting (see also `docs/development-plan.md` Section 6):

1. **Dashboard** — show the role switcher (ADMIN/AUTHORITY/FIELD_OFFICER/ANALYST/VIEWER), then tap **Normal** scenario — all zones LOW/MEDIUM.
2. Tap **Heavy Rain** — watch risk levels rise on the Dashboard stat cards.
3. Tap **Critical** — several zones go CRITICAL, an alert banner appears, and entries show up on the **Alerts** tab.
4. **Risk Map** — tap a marker/zone to show the full detail panel (score, confidence, rainfall, slope, historical density, model version).
5. **Reports** — switch role to FIELD_OFFICER, capture GPS location (or let it fall back to the region centroid if location permission is denied), describe an observation, pick severity + observed signs, optionally attach a photo, submit. Turn on airplane mode (or toggle the **FORCED OFFLINE** demo switch, which overrides real connectivity) to show the report queues locally as `PENDING_SYNC` — the app detects real network state via NetInfo, so this also works by actually disconnecting the device. Reconnect and it **auto-syncs** (or tap **Sync** manually) to show the report moving to `SYNCED` with an AI analysis attached.
6. Switch role to AUTHORITY and tap **Verify** on the synced report.
7. **Analytics** — show the risk distribution bar chart and the event summary reflecting everything just demonstrated.
8. **Reset demo data** on the Analytics tab (or the Dashboard's Demo mode card) before your next run-through.

**Safety net:** the Dashboard has a **Demo mode** card with a one-tap **Generate sample field report** button — it creates a realistic report tied to the current scenario and highest-risk zone and syncs it through AI analysis automatically. Use it if live typing/GPS/photo steps risk eating your time slot; it exercises the same underlying code path as the manual form.

## Project layout

```
mobile/    Expo/React Native app (all screens, risk engine, mock data)
server/    Minimal Node proxy server for Groq (keeps the API key server-side)
docs/      Development plan, risk model, data sources
```

## Known limitations (say this proactively if asked)

- Terrain/historical data is illustrative, not pulled from a live DEM/GSI export today (`docs/data-sources.md` documents exactly what to substitute).
- No Supabase/Postgres/PostGIS backend yet — state lives in the app (AsyncStorage) for this crunch build; the full plan's Phase 2 schema is the documented path to a real backend.
- The risk score is a documented deterministic formula (`baseline-v1`), not a trained ML model — this is a deliberate, defensible choice given the data available (see `docs/risk-model.md`).
- Native map (react-native-maps) only renders on iOS/Android via Expo Go; the web preview used during development shows a data-equivalent list instead.
