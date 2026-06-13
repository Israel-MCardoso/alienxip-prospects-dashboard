-- Migration: Sprint 16 - n8n Outreach Tables, RLS, and Security Config

-- 1. Create prospect_outreach table
create table if not exists public.prospect_outreach (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null unique references public.prospects(id) on delete cascade,
  status text not null default 'not_started',
  channel text not null default 'whatsapp',
  automation_source text,
  n8n_workflow_id text,
  n8n_execution_id text,
  last_message_at timestamptz,
  next_follow_up_at timestamptz,
  meeting_scheduled_at timestamptz,
  meeting_link text,
  paused_at timestamptz,
  stopped_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  last_message_preview text,
  meeting_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create outreach_events table
create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  outreach_id uuid references public.prospect_outreach(id) on delete cascade,
  event_type text not null,
  status text not null,
  channel text not null default 'whatsapp',
  message text,
  n8n_execution_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Create partial unique index to prevent duplicate events for the same execution
create unique index if not exists outreach_events_execution_event_idx 
on public.outreach_events (n8n_execution_id, event_type) 
where n8n_execution_id is not null;

-- Enable RLS
alter table public.prospect_outreach enable row level security;
alter table public.outreach_events enable row level security;

-- Drop policies for idempotency
drop policy if exists "authenticated users can read prospect_outreach" on public.prospect_outreach;
drop policy if exists "operators can write prospect_outreach" on public.prospect_outreach;
drop policy if exists "operators can update prospect_outreach" on public.prospect_outreach;

drop policy if exists "authenticated users can read outreach_events" on public.outreach_events;
drop policy if exists "operators can write outreach_events" on public.outreach_events;

-- Create policies for prospect_outreach
create policy "authenticated users can read prospect_outreach"
on public.prospect_outreach for select
to authenticated
using (true);

create policy "operators can write prospect_outreach"
on public.prospect_outreach for insert
to authenticated
with check (public.has_active_profile() and public.has_app_role('operator'));

create policy "operators can update prospect_outreach"
on public.prospect_outreach for update
to authenticated
using (public.has_active_profile() and public.has_app_role('operator'))
with check (public.has_active_profile() and public.has_app_role('operator'));

-- Create policies for outreach_events
create policy "authenticated users can read outreach_events"
on public.outreach_events for select
to authenticated
using (true);

create policy "operators can write outreach_events"
on public.outreach_events for insert
to authenticated
with check (public.has_active_profile() and public.has_app_role('operator'));

-- Set updated_at trigger for prospect_outreach
drop trigger if exists prospect_outreach_set_updated_at on public.prospect_outreach;
create trigger prospect_outreach_set_updated_at
before update on public.prospect_outreach
for each row execute function public.set_updated_at();

-- Grant permissions to authenticated, service_role, etc.
grant select, insert, update, delete on public.prospect_outreach to authenticated, service_role;
grant select, insert, update, delete on public.outreach_events to authenticated, service_role;
grant usage, select, update on all sequences in schema public to authenticated, service_role;
