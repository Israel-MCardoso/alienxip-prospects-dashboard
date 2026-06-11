alter table public.prospects
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

alter table public.companies
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

alter table public.clients
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

alter table public.commercial_tasks
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

update public.prospects
set owner_id = responsible_user_id
where owner_id is null and responsible_user_id is not null;

update public.commercial_tasks
set owner_id = coalesce(assigned_to, created_by)
where owner_id is null and (assigned_to is not null or created_by is not null);

update public.clients c
set owner_id = p.owner_id
from public.prospects p
where c.owner_id is null and p.converted_client_id = c.id and p.owner_id is not null;

update public.companies co
set owner_id = p.owner_id
from public.prospects p
where co.owner_id is null and p.converted_company_id = co.id and p.owner_id is not null;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.activities (entity_type, entity_id, actor_id, action, title, description, metadata, created_at)
select
  'prospect',
  prospect_id,
  actor_id,
  action_type::text,
  action_type::text,
  description,
  metadata,
  created_at
from public.prospect_activities
where prospect_id is not null;

insert into public.activities (entity_type, entity_id, actor_id, action, title, description, metadata, created_at)
select
  'project',
  project_id,
  actor_id,
  action_type,
  action_type,
  description,
  metadata,
  created_at
from public.project_activities;

create index if not exists prospects_owner_idx on public.prospects(owner_id);
create index if not exists companies_owner_idx on public.companies(owner_id);
create index if not exists clients_owner_idx on public.clients(owner_id);
create index if not exists commercial_tasks_owner_idx on public.commercial_tasks(owner_id);
create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists activities_entity_idx on public.activities(entity_type, entity_id);
create index if not exists activities_actor_idx on public.activities(actor_id);
create index if not exists activities_created_at_idx on public.activities(created_at desc);
create index if not exists activities_action_idx on public.activities(action);

alter table public.activities enable row level security;

create policy "authenticated users can read activities"
on public.activities for select
to authenticated
using (true);

create policy "authenticated users can create activities"
on public.activities for insert
to authenticated
with check (true);
