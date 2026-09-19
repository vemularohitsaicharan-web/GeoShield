# Database (Phase 10)

**No database exists in this build.** State lives on-device (React Context + AsyncStorage in `mobile/lib/AppContext.tsx`) — this was a deliberate crunch-scope decision (see `development-plan.md` Section 8), not an oversight.

The intended schema (17 tables: `profiles`, `sensor_devices`, `sensor_readings`, `historical_landslides`, `terrain_cells`, `risk_predictions`, `villages`, `roads`, `infrastructure`, `field_reports`, `field_report_ai`, `alerts`, `alert_recipients`, `model_versions`, `notification_tokens`, `audit_logs`) with PostGIS geography types and RLS policies per role is fully specified in **Phase 2 of [`development-plan.md`](development-plan.md)** — that's the actual database design, ready to hand to Claude Code as the next real phase once there's runway for it.

The current in-app data model (`mobile/lib/types.ts`) mirrors that future schema's shape closely on purpose, so migrating from local state to real Supabase tables later is a data-layer swap, not a redesign.
