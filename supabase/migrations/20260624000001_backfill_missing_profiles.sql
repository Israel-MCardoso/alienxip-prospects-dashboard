-- Migration: 20260624000001_backfill_missing_profiles
-- Objective: Backfill profiles for auth.users that exist before the handle_new_user
-- trigger was added in sprint_11. Without a profile row, has_active_profile() returns
-- false and the INSERT RLS policy on prospects (and other tables) blocks all writes.
-- Safe to run multiple times: NOT EXISTS guard + ON CONFLICT DO NOTHING ensure idempotency.

insert into public.profiles (id, email, full_name, role, is_active)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    split_part(u.email, '@', 1)
  ) as full_name,
  'member' as role,
  true as is_active
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
)
on conflict (id) do nothing;
