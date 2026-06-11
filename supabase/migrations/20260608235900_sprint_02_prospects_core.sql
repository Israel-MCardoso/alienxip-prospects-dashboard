create extension if not exists "pgcrypto";

create type public.app_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
create type public.prospect_status as enum ('new', 'qualified', 'contacted', 'meeting_scheduled', 'proposal_sent', 'won', 'lost', 'archived');
create type public.prospect_temperature as enum ('cold', 'warm', 'hot');
create type public.prospect_source as enum ('manual', 'google_sheet', 'referral', 'instagram', 'website', 'other');
create type public.prospect_note_type as enum ('observacao', 'follow_up', 'reuniao', 'decisao', 'risco');
create type public.prospect_activity_type as enum ('created', 'updated', 'imported', 'diagnostic_created', 'diagnostic_updated', 'note_created', 'status_changed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  role public.app_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text,
  status public.prospect_status not null default 'new',
  temperature public.prospect_temperature not null default 'warm',
  source public.prospect_source not null default 'manual',
  city text,
  state text,
  instagram_url text,
  website_url text,
  whatsapp text,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  partner_name text,
  partner_url text,
  priority_score integer not null default 0,
  suggested_offer text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  imported_from text,
  external_source_id text,
  constraint prospects_priority_score_range check (priority_score >= 0 and priority_score <= 100)
);

create table public.prospect_diagnostics (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  facebook_notes text,
  instagram_notes text,
  whatsapp_notes text,
  website_notes text,
  google_business_notes text,
  diagnosis_summary text,
  opportunities jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prospect_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  type public.prospect_note_type not null default 'observacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action_type public.prospect_activity_type not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index prospects_import_source_unique
  on public.prospects(imported_from, external_source_id)
  where imported_from is not null and external_source_id is not null;

create index prospects_status_idx on public.prospects(status);
create index prospects_temperature_idx on public.prospects(temperature);
create index prospects_responsible_user_idx on public.prospects(responsible_user_id);
create index prospects_city_state_idx on public.prospects(city, state);
create index prospect_notes_prospect_idx on public.prospect_notes(prospect_id);
create index prospect_diagnostics_prospect_idx on public.prospect_diagnostics(prospect_id);
create index prospect_activities_prospect_idx on public.prospect_activities(prospect_id);
create index prospect_activities_created_at_idx on public.prospect_activities(created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger prospects_set_updated_at
before update on public.prospects
for each row execute function public.set_updated_at();

create trigger prospect_diagnostics_set_updated_at
before update on public.prospect_diagnostics
for each row execute function public.set_updated_at();

create trigger prospect_notes_set_updated_at
before update on public.prospect_notes
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin_or_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('admin', 'owner'), false)
$$;

alter table public.profiles enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_diagnostics enable row level security;
alter table public.prospect_notes enable row level security;
alter table public.prospect_activities enable row level security;

create policy "authenticated users can read active profiles"
on public.profiles for select
to authenticated
using (is_active = true);

create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "authenticated users can read prospects"
on public.prospects for select
to authenticated
using (true);

create policy "authenticated users can create prospects"
on public.prospects for insert
to authenticated
with check (true);

create policy "authenticated users can update prospects"
on public.prospects for update
to authenticated
using (true)
with check (true);

create policy "admins can delete prospects"
on public.prospects for delete
to authenticated
using (public.is_admin_or_owner());

create policy "authenticated users can read diagnostics"
on public.prospect_diagnostics for select
to authenticated
using (true);

create policy "authenticated users can create diagnostics"
on public.prospect_diagnostics for insert
to authenticated
with check (true);

create policy "authenticated users can update diagnostics"
on public.prospect_diagnostics for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read notes"
on public.prospect_notes for select
to authenticated
using (true);

create policy "authenticated users can create notes"
on public.prospect_notes for insert
to authenticated
with check (true);

create policy "authenticated users can update notes"
on public.prospect_notes for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read activities"
on public.prospect_activities for select
to authenticated
using (true);

create policy "authenticated users can create activities"
on public.prospect_activities for insert
to authenticated
with check (true);
