-- Migration: Sprint 12 - Proposals Table and RLS policies

create table if not exists public.prospect_proposals (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  title text not null,
  value numeric not null default 0,
  status text not null default 'draft', -- draft, sent, accepted, rejected, cancelled
  valid_until date,
  content text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.prospect_proposals enable row level security;

-- Drop policies for idempotency
drop policy if exists "authenticated users can read proposals" on public.prospect_proposals;
drop policy if exists "authenticated users can create proposals" on public.prospect_proposals;
drop policy if exists "authenticated users can update proposals" on public.prospect_proposals;

-- Create security policies
create policy "authenticated users can read proposals"
on public.prospect_proposals for select
to authenticated
using (true);

create policy "authenticated users can create proposals"
on public.prospect_proposals for insert
to authenticated
with check (true);

create policy "authenticated users can update proposals"
on public.prospect_proposals for update
to authenticated
using (true)
with check (true);

-- Set updated_at trigger
drop trigger if exists prospect_proposals_set_updated_at on public.prospect_proposals;
create trigger prospect_proposals_set_updated_at
before update on public.prospect_proposals
for each row execute function public.set_updated_at();
