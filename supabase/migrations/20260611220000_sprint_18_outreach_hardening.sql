-- Migration: Sprint 18 - Outreach Infrastructure Hardening (Batches and Indexes)

-- 1. Create outreach_batches table
create table if not exists public.outreach_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null unique,
  automation_source text not null,
  status text not null default 'created', -- 'created', 'dispatched', 'partially_dispatched', 'failed', 'completed'
  total_requested integer not null default 0,
  total_valid integer not null default 0,
  total_skipped integer not null default 0,
  total_dispatched integer not null default 0,
  n8n_response_status integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_email text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.outreach_batches enable row level security;

-- Create policies for outreach_batches
drop policy if exists "authenticated users can read outreach_batches" on public.outreach_batches;
drop policy if exists "operators can insert outreach_batches" on public.outreach_batches;
drop policy if exists "operators can update outreach_batches" on public.outreach_batches;

create policy "authenticated users can read outreach_batches"
on public.outreach_batches for select
to authenticated
using (true);

create policy "operators can insert outreach_batches"
on public.outreach_batches for insert
to authenticated
with check (public.has_active_profile() and public.has_app_role('operator'));

create policy "operators can update outreach_batches"
on public.outreach_batches for update
to authenticated
using (public.has_active_profile() and public.has_app_role('operator'))
with check (public.has_active_profile() and public.has_app_role('operator'));

-- Set updated_at trigger for outreach_batches
drop trigger if exists outreach_batches_set_updated_at on public.outreach_batches;
create trigger outreach_batches_set_updated_at
before update on public.outreach_batches
for each row execute function public.set_updated_at();

-- Grant permissions
grant select, insert, update, delete on public.outreach_batches to authenticated, service_role;
grant usage, select, update on all sequences in schema public to authenticated, service_role;

-- 2. Indexes for outreach_events (Performance & Avoid Sequential Scans)
create index if not exists outreach_events_prospect_id_idx
on public.outreach_events (prospect_id);

create index if not exists outreach_events_outreach_id_idx
on public.outreach_events (outreach_id);

create index if not exists outreach_events_created_at_idx
on public.outreach_events (created_at desc);

-- 3. Indexes for prospect_outreach (Status & Source Filtering)
create index if not exists prospect_outreach_status_idx
on public.prospect_outreach (status);

create index if not exists prospect_outreach_automation_source_idx
on public.prospect_outreach (automation_source);

-- 4. Composite Indexes
create index if not exists prospect_outreach_status_source_idx
on public.prospect_outreach (status, automation_source);

create index if not exists outreach_events_prospect_created_idx
on public.outreach_events (prospect_id, created_at desc);
