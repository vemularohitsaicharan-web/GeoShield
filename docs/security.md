# Security Audit (Phase 10)

Audit performed 2026-09-19 against the crunch-scope build (`mobile/` Expo app + `server/` Groq proxy). No Supabase/RLS layer exists yet in this build (see Section 8 of `development-plan.md`), so several Phase 10 checklist items are scoped to what's actually built rather than the full target architecture.

## Secrets

- **`GROQ_API_KEY` never ships in the app.** `mobile/lib/groqClient.ts` only ever calls `server/index.mjs` over HTTP; the key itself is read server-side from `server/.env` (or plain `process.env`) and never referenced from any file under `mobile/`. Verified by inspection — `grep -r GROQ_API_KEY mobile/` returns no matches outside comments.
- **No `.env` file existed on disk at audit time** (key not yet configured). No secrets were ever at risk of being committed.
- **Added a root-level `.gitignore`** (previously missing) that explicitly excludes `server/.env` and `server/.env.*` while allowlisting `server/.env.example`, plus `node_modules/`, Expo build artifacts, and native keystore/certificate file patterns. This was a real gap: had the project been `git init`'d and committed before this fix, a configured Groq key would have been committed with it. **Do this before running `git init`, not after.**
- No Supabase service-role key or equivalent exists in this build (no Supabase integration yet).

## Frontend exposure

- Confirmed no API keys, tokens, or credentials appear in any file under `mobile/` via a project-wide grep for common secret patterns (`API_KEY`, `SECRET`, `sk-`, `Bearer `).
- The Groq proxy (`server/index.mjs`) sets permissive CORS (`Access-Control-Allow-Origin: *`) — acceptable for a local-network hackathon demo talking only to your own phone, **not acceptable as-is for any public deployment** (see `docs/deployment.md`).

## Input validation

- Risk engine (`mobile/lib/riskEngine.ts`) clamps all numeric inputs to documented bounds before use — verified by unit tests (`negative/invalid-looking values do not crash the engine`, `feature normalization clamps out-of-range values`).
- Groq proxy validates request body shape loosely (`String(body.text || "")`, array check on `signs`) before forwarding to the Groq API — sufficient for a local demo; a public deployment should add stricter schema validation and a body-size limit.
- The fallback classifier (`mobile/lib/groqClient.ts`) was found and fixed during this session to avoid a false-positive severity classification from naive negation-blind keyword matching (see `MEMORY`/session log — "no cracks observed" was previously misread as a positive rockfall/crack signal).

## What's NOT applicable yet (no backend exists)

- Row Level Security, Supabase Auth, database migrations — all Phase 2 items, not built in this crunch scope. Tracked as explicit future work in `docs/development-plan.md` Section 8.
- File upload validation for field-report photos — photos are stored as local device URIs only (`expo-image-picker`), never uploaded anywhere in this build, so server-side validation doesn't yet apply.

## Performance audit

At this build's scale (8 demo terrain cells, all state in-memory/AsyncStorage) most of the Phase 10 performance checklist doesn't yet apply — there's no database to over-query and no large dataset to paginate. What was actually checked:

- Risk predictions and marker/circle rendering are memoized (`useMemo`/`Map` lookups in `RiskMapView.tsx`, `AppContext.tsx`) so switching scenarios doesn't recompute or re-render more than necessary.
- Map markers set `tracksViewChanges={false}` to avoid react-native-maps' expensive per-frame diffing.
- AsyncStorage persistence writes only on actual state changes (role/scenario/reports/alerts), not on every render.

Once a real backend exists (Phase 2+), re-audit against the original checklist: paginate reports, limit GIS viewport queries, avoid loading full tables into the app, cache static data (villages/roads/terrain don't change per-request).

## Recommendations before any public deployment

1. Restrict the Groq proxy's CORS origin to the deployed app's actual origin instead of `*`.
2. Add rate limiting to `server/index.mjs` (currently none — fine for a single-phone demo, not for a public endpoint).
3. Move the Groq proxy behind a real backend (Supabase Edge Function, per the Phase 7 plan) rather than a bare Node process before any real users touch it.
