-- GeoShield-NER Phase 2 — initial schema
-- Run this once in Supabase Studio -> SQL Editor (or `supabase db push`).
--
-- Scope note: this covers exactly the tables the current app uses
-- (terrain_cells, historical_landslides, villages, roads, field_reports,
-- alerts, risk_predictions, profiles). The full 17-table target schema
-- from docs/development-plan.md Phase 2 (sensor_devices, sensor_readings,
-- infrastructure, model_versions, notification_tokens, audit_logs, etc.)
-- is documented there as the next increment, not built here, to keep
-- this migration honest about what's actually wired up today.
--
-- Design note: every table stores plain numeric lat/lon (or a jsonb path
-- for roads) as the columns the app actually reads, PLUS a `location`/
-- `path_geom` PostGIS geography column generated from them for spatial
-- indexing. This avoids client-side WKB/GeoJSON parsing entirely — the
-- REST API returns plain numbers, and PostGIS is still real and queryable
-- (e.g. future "landslides within N km of this point" queries) via the
-- generated geography column.

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- profiles: one row per Supabase Auth user (created via anonymous auth
-- from the app — there is no login/signup screen; each device gets an
-- anonymous session, and the role switcher in the UI updates this row).
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'VIEWER'
    check (role in ('ADMIN','AUTHORITY','FIELD_OFFICER','ANALYST','VIEWER')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select to authenticated using (auth.uid() = id);

create policy "profiles: insert own" on profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update to authenticated using (auth.uid() = id);

-- Helper: current user's role, defaulting to VIEWER if no profile row yet.
create or replace function current_role_name() returns text
language sql stable security definer as $$
  select coalesce((select role from profiles where id = auth.uid()), 'VIEWER');
$$;

-- ---------------------------------------------------------------------
-- Reference geo data (terrain, historical events, villages, roads).
-- Seeded once from scripts/seed.mjs. Read-only from the app; gated to
-- authenticated (anonymous auth still counts) rather than fully public.
-- ---------------------------------------------------------------------
create table if not exists terrain_cells (
  id text primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  location geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lon, lat), 4326)::geography
  ) stored,
  elevation_m numeric not null,
  slope_degrees numeric not null
);
create index if not exists terrain_cells_location_idx on terrain_cells using gist (location);

create table if not exists historical_landslides (
  id text primary key,
  lat double precision not null,
  lon double precision not null,
  location geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lon, lat), 4326)::geography
  ) stored,
  year int not null,
  note text
);
create index if not exists historical_landslides_location_idx on historical_landslides using gist (location);

create table if not exists villages (
  id text primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  location geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lon, lat), 4326)::geography
  ) stored,
  population_est int
);
create index if not exists villages_location_idx on villages using gist (location);

create table if not exists roads (
  id text primary key,
  name text not null,
  -- Array of [lat, lon] pairs, e.g. [[25.36,91.71],[25.28,91.72]] —
  -- matches mobile/lib/types.ts's RoadSegment.path shape directly.
  path jsonb not null
);

alter table terrain_cells enable row level security;
alter table historical_landslides enable row level security;
alter table villages enable row level security;
alter table roads enable row level security;

create policy "terrain_cells: read" on terrain_cells for select to authenticated using (true);
create policy "historical_landslides: read" on historical_landslides for select to authenticated using (true);
create policy "villages: read" on villages for select to authenticated using (true);
create policy "roads: read" on roads for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- risk_predictions: written by the app's client-side deterministic risk
-- engine (docs/risk-model.md) after each scenario run. Not LLM-derived.
-- ---------------------------------------------------------------------
create table if not exists risk_predictions (
  id uuid primary key default gen_random_uuid(),
  cell_id text not null references terrain_cells(id),
  risk_score numeric not null check (risk_score >= 0 and risk_score <= 1),
  risk_level text not null check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  confidence numeric not null,
  model_version text not null,
  inputs jsonb not null,
  computed_at timestamptz not null default now()
);
create index if not exists risk_predictions_cell_idx on risk_predictions (cell_id, computed_at desc);

alter table risk_predictions enable row level security;

create policy "risk_predictions: read" on risk_predictions for select to authenticated using (true);
create policy "risk_predictions: insert" on risk_predictions for insert to authenticated with check (true);

-- ---------------------------------------------------------------------
-- field_reports: offline-first citizen/field-officer reports.
-- Insert restricted to FIELD_OFFICER/ADMIN; verify/reject restricted to
-- AUTHORITY/ADMIN; everyone authenticated can read (matches the app's
-- current Reports list, which is visible to all roles).
-- ---------------------------------------------------------------------
create table if not exists field_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id),
  reporter_label text not null,
  lat double precision not null,
  lon double precision not null,
  location geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lon, lat), 4326)::geography
  ) stored,
  description text not null default '',
  severity text not null check (severity in ('LOW','MEDIUM','HIGH')),
  observed_signs text[] not null default '{}',
  photo_url text,
  status text not null default 'PENDING_SYNC'
    check (status in ('DRAFT','PENDING_SYNC','SYNCED','UNDER_REVIEW','VERIFIED','REJECTED')),
  ai_category text,
  ai_severity text,
  ai_summary text,
  ai_confidence numeric,
  ai_model text,
  ai_source text check (ai_source in ('groq','fallback')),
  created_at timestamptz not null default now()
);
create index if not exists field_reports_location_idx on field_reports using gist (location);
create index if not exists field_reports_status_idx on field_reports (status);

alter table field_reports enable row level security;

create policy "field_reports: read all" on field_reports
  for select to authenticated using (true);

create policy "field_reports: insert by field officers" on field_reports
  for insert to authenticated
  with check (current_role_name() in ('FIELD_OFFICER','ADMIN') and reporter_id = auth.uid());

create policy "field_reports: ai-sync update by owner" on field_reports
  for update to authenticated
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

create policy "field_reports: verify by authority" on field_reports
  for update to authenticated
  using (current_role_name() in ('AUTHORITY','ADMIN'))
  with check (current_role_name() in ('AUTHORITY','ADMIN'));

-- ---------------------------------------------------------------------
-- alerts: created client-side from risk thresholds or AI-flagged
-- reports. Acknowledge restricted to AUTHORITY/ADMIN.
-- ---------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  cell_id text references terrain_cells(id),
  report_id uuid references field_reports(id),
  level text not null check (level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  message text not null,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','ACKNOWLEDGED','RESOLVED','EXPIRED')),
  created_at timestamptz not null default now()
);

alter table alerts enable row level security;

create policy "alerts: read" on alerts for select to authenticated using (true);
create policy "alerts: insert" on alerts for insert to authenticated with check (true);
create policy "alerts: acknowledge by authority" on alerts
  for update to authenticated
  using (current_role_name() in ('AUTHORITY','ADMIN'))
  with check (current_role_name() in ('AUTHORITY','ADMIN'));

-- ---------------------------------------------------------------------
-- Storage bucket for field report photos.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('field-report-photos', 'field-report-photos', true)
on conflict (id) do nothing;

create policy "field-report-photos: read" on storage.objects
  for select to authenticated using (bucket_id = 'field-report-photos');

-- Note: intentionally not role-gated here (unlike field_reports' own
-- insert policy). storage.objects RLS runs through the separate
-- storage-api service, where current_role_name() (a public-schema
-- SECURITY DEFINER function) does not reliably resolve auth.uid() the
-- same way it does for ordinary table policies — attempting that gated
-- version returns a bare RLS violation with no further detail. The
-- actual report record's role restriction (FIELD_OFFICER/ADMIN) is
-- still enforced by the field_reports insert policy above; this policy
-- only gates which bucket authenticated users may write into.
create policy "field-report-photos: upload by authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'field-report-photos');
