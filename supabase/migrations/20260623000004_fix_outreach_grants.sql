-- Migration: 20260623000004_fix_outreach_grants
-- Objective: Fix explicit table grants on Outreach and Proposals module tables to avoid permission denied errors for authenticated users.

-- 1. Grant usage on schema public
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- 2. Grant explicit select, insert, update, delete permissions on known module tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_outreach TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_events TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_proposals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_dead_letters TO authenticated, service_role;
