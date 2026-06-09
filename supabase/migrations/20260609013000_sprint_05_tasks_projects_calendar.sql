do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('planning', 'active', 'paused', 'completed', 'canceled');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_priority') then
    create type public.project_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
end $$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  priority public.project_priority not null default 'medium',
  start_date date,
  due_date date,
  completed_at timestamptz,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commercial_tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create table public.project_activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_client_idx on public.projects(client_id);
create index projects_company_idx on public.projects(company_id);
create index projects_status_idx on public.projects(status);
create index projects_priority_idx on public.projects(priority);
create index projects_due_date_idx on public.projects(due_date);
create index projects_owner_idx on public.projects(owner_id);
create index commercial_tasks_project_idx on public.commercial_tasks(project_id);
create index project_activities_project_idx on public.project_activities(project_id);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_activities enable row level security;

create policy "authenticated users can read projects"
on public.projects for select
to authenticated
using (true);

create policy "authenticated users can create projects"
on public.projects for insert
to authenticated
with check (true);

create policy "owners creators or admins can update projects"
on public.projects for update
to authenticated
using (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner())
with check (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read project activities"
on public.project_activities for select
to authenticated
using (true);

create policy "authenticated users can create project activities"
on public.project_activities for insert
to authenticated
with check (true);
