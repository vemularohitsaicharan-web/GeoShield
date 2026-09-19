# GeoShield-NER — Run Guide

AI-powered landslide risk monitoring & early warning prototype for the North Eastern Region of India (Smart India Hackathon). React Native / Expo mobile app, backed by a real Supabase database + Auth + Storage, a Groq AI proxy server, and a documented deterministic risk engine.

See [`docs/development-plan.md`](docs/development-plan.md) for the full phased plan, [`docs/risk-model.md`](docs/risk-model.md) for the risk formula, [`docs/data-sources.md`](docs/data-sources.md) for what's real vs. illustrative in the demo data, and [`docs/security.md`](docs/security.md) for the security audit.

## 1. Set up Supabase (one-time)

1. Create a Supabase project.
2. SQL Editor → run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then [`0002_fix_storage_policy.sql`](supabase/migrations/0002_fix_storage_policy.sql).
3. Copy `server/.env.example` to `server/.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API), and a `DEMO_PASSWORD` of your choice.
4. Copy `mobile/.env.example` to `mobile/.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same values, public-safe key).
5. From the repo root: `npm install && npm run seed` (populates terrain/village/road reference data) and `node scripts/create-demo-user.mjs` (creates the 5 role login accounts — see Section 3).

Note: Supabase's "anonymous sign-ins" project toggle proved unreliable during setup (see `docs/security.md`) — this app doesn't depend on it; the 5 fixed role accounts below are the real auth path.

## 2. Start the Groq proxy server

The app never holds the Groq API key directly — this tiny server does, and the app calls it over the local network.

```bash
cd server
```

Set `GROQ_API_KEY=<your key>` in `server/.env` (get one free at console.groq.com; current working model is `openai/gpt-oss-20b`, not the older `llama-3.1` names). If you skip this, the app still works — every AI call falls back to a deterministic local analysis, which is architecturally correct (the app must keep working if Groq is unavailable) but less impressive live.

```bash
node index.mjs
```

Leave this running. You should see `GeoShield-NER Groq proxy listening on http://localhost:8787`.

## 3. Log in

The app has a real Login screen, not a free-text signup — five fixed demo accounts, one per role, each with its own Supabase Auth session and `profiles.role` enforced by Row Level Security:

| Role | Email |
|---|---|
| Admin | admin@geoshield-ner.demo |
| Authority | authority@geoshield-ner.demo |
| Field Officer | field-officer@geoshield-ner.demo |
| Analyst | analyst@geoshield-ner.demo |
| Viewer | viewer@geoshield-ner.demo |

Tap a role card on the Login screen to sign in as that account — no password entry needed in the UI. If Supabase isn't configured at all, the app skips the login gate entirely and runs local-only as AUTHORITY.

## 4. Start the Expo app

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

## 5. Demo script

Run through this once before presenting (see also `docs/development-plan.md` Section 6):

1. **Login** — show the 5 role accounts, sign in as AUTHORITY.
2. **Dashboard** — tap **Normal** scenario — all zones LOW/MEDIUM.
3. Tap **Heavy Rain** — watch risk levels rise on the Dashboard stat cards.
4. Tap **Critical** — several zones go CRITICAL, an alert banner appears, and entries show up on the **Alerts** tab.
5. **Risk Map** — tap a marker/zone to show the full detail panel (score, confidence, rainfall, slope, historical density, model version).
6. **Log out**, sign in as **Field Officer**. **Reports** — capture GPS location (or let it fall back to the region centroid if location permission is denied), describe an observation, pick severity + observed signs, optionally attach a photo, submit. Toggle **FORCED OFFLINE** (or real airplane mode — the app detects actual network state via NetInfo) to show the report queues locally as `PENDING_SYNC`. Reconnect and it **auto-syncs** (or tap **Sync** manually) to show the report moving to `SYNCED` with a real Groq AI analysis attached, and persisted to Supabase.
7. **Log out**, sign in as **Authority**, tap **Verify** on the synced report (only Authority/Admin can — enforced by RLS, not just the UI).
8. **Analytics** — show the risk distribution bar chart and event summary.
9. **Reset demo data** on the Analytics tab (or the Dashboard's Demo mode card) before your next run-through.

**Safety net:** the Dashboard has a **Demo mode** card with a one-tap **Generate sample field report** button — it creates a realistic report tied to the current scenario and highest-risk zone and syncs it through AI analysis automatically (requires being logged in as Field Officer or Admin, per RLS). Use it if live typing/GPS/photo steps risk eating your time slot.

## Project layout

```
mobile/    Expo/React Native app (screens, risk engine, Supabase client, login)
server/    Minimal Node proxy server for Groq (keeps the API key server-side)
supabase/  SQL migrations (schema + RLS policies)
scripts/   One-off setup scripts (seed reference data, create demo accounts)
docs/      Development plan, risk model, data sources, security audit
```

## Known limitations (say this proactively if asked)

- Terrain/historical reference data is illustrative (real place, placeholder point values), not pulled from a live DEM/GSI export today (`docs/data-sources.md` documents exactly what to substitute).
- The risk score is a documented deterministic formula (`baseline-v1`), not a trained ML model — this is a deliberate, defensible choice given no real labeled incident data exists yet (see `docs/risk-model.md`).
- The 5 login accounts are fixed demo accounts (one shared password across them), not a general signup flow — appropriate for a hackathon demo with 5 known roles, not real distinct users.
- Native map (react-native-maps) only renders on iOS/Android via Expo Go; the web preview used during development shows a data-equivalent list instead.
- Photo upload to Supabase Storage is implemented but not fully verified end-to-end on-device — verify during the Expo Go check.
