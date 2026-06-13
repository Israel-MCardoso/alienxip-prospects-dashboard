-- Migration: Sprint 16.5 - Webhook Audit Logs Table, RLS, and Security Config

-- 1. Create webhook_audit_logs table
create table if not exists public.webhook_audit_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id text,
  event_type text,
  status text not null,
  secret_validated boolean not null default false,
  duplicate_ignored boolean not null default false,
  payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.webhook_audit_logs enable row level security;

-- Drop policies for idempotency
drop policy if exists "authenticated users can read webhook_audit_logs" on public.webhook_audit_logs;

-- Create policies for webhook_audit_logs
create policy "authenticated users can read webhook_audit_logs"
on public.webhook_audit_logs for select
to authenticated
using (true);

-- Grant permissions to authenticated, service_role, etc.
grant select, insert, update, delete on public.webhook_audit_logs to authenticated, service_role;
grant usage, select, update on all sequences in schema public to authenticated, service_role;
