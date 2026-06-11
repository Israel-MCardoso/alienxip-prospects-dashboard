create type public.tech_bug_status as enum ('open', 'triage', 'in_progress', 'fixed', 'wont_fix', 'closed');
create type public.tech_incident_status as enum ('investigating', 'identified', 'monitoring', 'resolved');
create type public.tech_severity as enum ('low', 'medium', 'high', 'critical');
create type public.tech_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.tech_backlog_type as enum ('refactor', 'infrastructure', 'feature', 'debt', 'security', 'performance');
create type public.tech_backlog_status as enum ('open', 'planned', 'in_progress', 'done', 'archived');
create type public.tech_roadmap_status as enum ('planned', 'in_progress', 'shipped', 'paused', 'canceled');
create type public.technical_decision_status as enum ('proposed', 'accepted', 'deprecated', 'superseded');
create type public.project_note_type as enum ('general', 'technical', 'meeting', 'risk', 'decision');

create table public.tech_bugs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.tech_bug_status not null default 'open',
  severity public.tech_severity not null default 'medium',
  priority public.tech_priority not null default 'medium',
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  reported_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tech_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.tech_incident_status not null default 'investigating',
  severity public.tech_severity not null default 'medium',
  started_at timestamptz,
  resolved_at timestamptz,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tech_backlog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.tech_backlog_status not null default 'open',
  priority public.tech_priority not null default 'medium',
  type public.tech_backlog_type not null default 'debt',
  project_id uuid references public.projects(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tech_roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.tech_roadmap_status not null default 'planned',
  priority public.tech_priority not null default 'medium',
  target_date date,
  project_id uuid references public.projects(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technical_decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null,
  decision text not null,
  consequences text,
  status public.technical_decision_status not null default 'proposed',
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  content text not null,
  type public.project_note_type not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'alienxip-files',
  path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  entity_type text not null,
  entity_id uuid not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index tech_bugs_status_idx on public.tech_bugs(status);
create index tech_bugs_severity_idx on public.tech_bugs(severity);
create index tech_bugs_project_idx on public.tech_bugs(project_id);
create index tech_bugs_assigned_to_idx on public.tech_bugs(assigned_to);
create index tech_incidents_status_idx on public.tech_incidents(status);
create index tech_incidents_owner_idx on public.tech_incidents(owner_id);
create index tech_backlog_status_idx on public.tech_backlog_items(status);
create index tech_backlog_owner_idx on public.tech_backlog_items(owner_id);
create index tech_roadmap_status_idx on public.tech_roadmap_items(status);
create index tech_roadmap_owner_idx on public.tech_roadmap_items(owner_id);
create index technical_decisions_project_idx on public.technical_decisions(project_id);
create index project_notes_project_idx on public.project_notes(project_id);
create index files_entity_idx on public.files(entity_type, entity_id);

create trigger tech_bugs_set_updated_at before update on public.tech_bugs for each row execute function public.set_updated_at();
create trigger tech_incidents_set_updated_at before update on public.tech_incidents for each row execute function public.set_updated_at();
create trigger tech_backlog_items_set_updated_at before update on public.tech_backlog_items for each row execute function public.set_updated_at();
create trigger tech_roadmap_items_set_updated_at before update on public.tech_roadmap_items for each row execute function public.set_updated_at();
create trigger technical_decisions_set_updated_at before update on public.technical_decisions for each row execute function public.set_updated_at();
create trigger project_notes_set_updated_at before update on public.project_notes for each row execute function public.set_updated_at();

alter table public.tech_bugs enable row level security;
alter table public.tech_incidents enable row level security;
alter table public.tech_backlog_items enable row level security;
alter table public.tech_roadmap_items enable row level security;
alter table public.technical_decisions enable row level security;
alter table public.project_notes enable row level security;
alter table public.files enable row level security;

create policy "authenticated users can read tech bugs" on public.tech_bugs for select to authenticated using (true);
create policy "authenticated users can create tech bugs" on public.tech_bugs for insert to authenticated with check (reported_by = auth.uid() or public.is_admin_or_owner());
create policy "owner assigned reporter or admin can update tech bugs" on public.tech_bugs for update to authenticated using (assigned_to = auth.uid() or reported_by = auth.uid() or public.is_admin_or_owner()) with check (assigned_to = auth.uid() or reported_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read incidents" on public.tech_incidents for select to authenticated using (true);
create policy "authenticated users can create incidents" on public.tech_incidents for insert to authenticated with check (created_by = auth.uid() or owner_id = auth.uid() or public.is_admin_or_owner());
create policy "owner creator or admin can update incidents" on public.tech_incidents for update to authenticated using (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()) with check (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read tech backlog" on public.tech_backlog_items for select to authenticated using (true);
create policy "authenticated users can create tech backlog" on public.tech_backlog_items for insert to authenticated with check (created_by = auth.uid() or owner_id = auth.uid() or public.is_admin_or_owner());
create policy "owner creator or admin can update tech backlog" on public.tech_backlog_items for update to authenticated using (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()) with check (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read tech roadmap" on public.tech_roadmap_items for select to authenticated using (true);
create policy "authenticated users can create tech roadmap" on public.tech_roadmap_items for insert to authenticated with check (created_by = auth.uid() or owner_id = auth.uid() or public.is_admin_or_owner());
create policy "owner creator or admin can update tech roadmap" on public.tech_roadmap_items for update to authenticated using (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()) with check (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read technical decisions" on public.technical_decisions for select to authenticated using (true);
create policy "authenticated users can create technical decisions" on public.technical_decisions for insert to authenticated with check (created_by = auth.uid() or public.is_admin_or_owner());
create policy "creator or admin can update technical decisions" on public.technical_decisions for update to authenticated using (created_by = auth.uid() or public.is_admin_or_owner()) with check (created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read project notes" on public.project_notes for select to authenticated using (true);
create policy "authenticated users can create project notes" on public.project_notes for insert to authenticated with check (author_id = auth.uid() or public.is_admin_or_owner());
create policy "author or admin can update project notes" on public.project_notes for update to authenticated using (author_id = auth.uid() or public.is_admin_or_owner()) with check (author_id = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read files" on public.files for select to authenticated using (true);
create policy "authenticated users can register files" on public.files for insert to authenticated with check (uploaded_by = auth.uid() or public.is_admin_or_owner());
