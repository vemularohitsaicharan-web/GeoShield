-- Fixes the photo-upload storage policy from 0001_init.sql — the
-- FIELD_OFFICER/ADMIN role check via current_role_name() does not
-- reliably resolve auth.uid() when evaluated through the storage-api
-- service's RLS context (unlike ordinary table policies), so it always
-- rejected uploads regardless of actual role. Run this once in
-- Supabase Studio -> SQL Editor if you already ran 0001_init.sql.

drop policy if exists "field-report-photos: upload by field officers" on storage.objects;

create policy "field-report-photos: upload by authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'field-report-photos');
