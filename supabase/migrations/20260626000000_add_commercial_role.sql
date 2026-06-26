-- Migration: 20260626000000_add_commercial_role
-- Objective: add a dedicated 'commercial' value to the app_role enum so sales
-- users can be scoped to commercial hubs by the application-layer RBAC.
-- No RLS/policy changes. No data migration.
-- Note: Postgres requires ADD VALUE to be committed before the new value can be
-- used, so run this statement BEFORE assigning role = 'commercial' to any profile.

alter type public.app_role add value if not exists 'commercial';
