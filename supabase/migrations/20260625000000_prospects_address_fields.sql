-- Optional location/address fields for prospects.
-- All columns are nullable; nothing is required. No RLS/policy changes.
-- Idempotent: safe to run more than once.
alter table public.prospects
  add column if not exists neighborhood text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists postal_code text;
