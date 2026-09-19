# Deployment (Phase 10)

## For the SIH demo (what you actually need today)

No deployment required — run locally on your machine and connect over Wi-Fi via Expo Go. See the root [`README.md`](../README.md) for exact commands. This is intentional: a local demo has zero dependency on hosting/DNS/TLS working on the day, and Expo Go on a real phone is a stronger demo than a simulator or a web build.

```bash
cd server && node index.mjs        # terminal 1
cd mobile && npx expo start        # terminal 2, scan QR with Expo Go
```

## If you need a shareable build after the hackathon

**Option A — EAS Update (fastest, no app store review):**
```bash
cd mobile
npx eas login
npx eas update:configure
npx eas update --branch preview
```
Anyone with Expo Go and the generated link can open the exact build without installing anything else. The Groq proxy still needs to be reachable from wherever the tester is — see "Backend" below.

**Option B — EAS Build (real installable APK/IPA):**
```bash
npx eas build --platform android --profile preview
```
Produces a real `.apk` judges can install directly, no Expo Go required. Takes longer (cloud build queue) — don't start this for the first time minutes before a presentation.

## Backend (the Groq proxy)

`server/index.mjs` is a bare Node process with no auth, permissive CORS (`*`), and no rate limiting — correct trade-offs for a same-device-network demo, wrong for anything public. Before pointing a shared/public build at it:

1. Deploy it somewhere reachable (Render/Railway/Fly.io free tier, or fold it into a Supabase Edge Function per the Phase 7 plan in `development-plan.md` — the latter is the intended long-term home).
2. Restrict CORS to your app's real origin.
3. Set `GROQ_API_KEY` as that platform's secret/environment variable — never commit it (see `docs/security.md`).
4. Update `mobile/lib/groqClient.ts`'s `getApiBase()` to point at the deployed URL instead of auto-detecting the local Metro LAN IP (that auto-detection only works for local dev).

## Full target architecture (post-hackathon)

Supabase (Postgres + PostGIS + Auth + RLS + Edge Functions) as described in Phase 2 of `development-plan.md`, with the mobile app talking to it directly for data and to a Supabase Edge Function for the Groq calls. Not built in this crunch-scoped prototype — tracked as explicit future work, not a gap to apologize for.

## Verify current free-tier limits

Whichever hosting you pick (Supabase, EAS, Render, etc.), check current free-tier request/bandwidth/build-minute limits before relying on them for a live demo — these change over time and this doc won't stay current with them.
