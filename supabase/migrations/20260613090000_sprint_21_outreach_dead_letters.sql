-- Sprint 21 production outreach readiness.
-- Prepared only. Do not apply without explicit production approval.

create table if not exists public.outreach_dead_letters (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  error text not null,
  source text not null check (source in ('callback', 'evolution', 'webhook', 'rate_limit', 'unknown')),
  attempt integer not null default 1 check (attempt >= 1),
  created_at timestamptz not null default now()
);

create index if not exists outreach_dead_letters_created_at_idx
  on public.outreach_dead_letters (created_at desc);

create index if not exists outreach_dead_letters_source_idx
  on public.outreach_dead_letters (source);
