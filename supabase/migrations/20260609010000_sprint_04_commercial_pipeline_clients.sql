alter type public.prospect_status add value if not exists 'frio';
alter type public.prospect_status add value if not exists 'contato_inicial';
alter type public.prospect_status add value if not exists 'diagnostico';
alter type public.prospect_status add value if not exists 'proposta';
alter type public.prospect_status add value if not exists 'negociacao';
alter type public.prospect_status add value if not exists 'fechado';
alter type public.prospect_status add value if not exists 'perdido';

alter type public.prospect_activity_type add value if not exists 'task_created';
alter type public.prospect_activity_type add value if not exists 'task_completed';
alter type public.prospect_activity_type add value if not exists 'converted_to_client';

create type public.commercial_task_status as enum ('pending', 'in_progress', 'completed', 'canceled');
create type public.commercial_task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.client_status as enum ('active', 'paused', 'former');
create type public.contract_status as enum ('draft', 'active', 'paused', 'cancelled');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  segment text,
  city text,
  state text,
  website_url text,
  instagram_url text,
  whatsapp text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  status public.client_status not null default 'active',
  contract_status public.contract_status not null default 'draft',
  monthly_value numeric,
  start_date date,
  main_contact_name text,
  main_contact_email text,
  main_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commercial_tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status public.commercial_task_status not null default 'pending',
  priority public.commercial_task_priority not null default 'medium',
  due_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prospects
  add column if not exists converted_company_id uuid references public.companies(id) on delete set null,
  add column if not exists converted_client_id uuid references public.clients(id) on delete set null,
  add column if not exists converted_at timestamptz;

create index companies_name_idx on public.companies(name);
create index clients_company_idx on public.clients(company_id);
create index commercial_tasks_prospect_idx on public.commercial_tasks(prospect_id);
create index commercial_tasks_assigned_to_idx on public.commercial_tasks(assigned_to);
create index commercial_tasks_status_idx on public.commercial_tasks(status);
create index prospects_converted_client_idx on public.prospects(converted_client_id);

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger commercial_tasks_set_updated_at
before update on public.commercial_tasks
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.commercial_tasks enable row level security;

create policy "authenticated users can read companies"
on public.companies for select
to authenticated
using (true);

create policy "authenticated users can create companies"
on public.companies for insert
to authenticated
with check (true);

create policy "authenticated users can update companies"
on public.companies for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read clients"
on public.clients for select
to authenticated
using (true);

create policy "authenticated users can create clients"
on public.clients for insert
to authenticated
with check (true);

create policy "authenticated users can update clients"
on public.clients for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read commercial tasks"
on public.commercial_tasks for select
to authenticated
using (true);

create policy "authenticated users can create commercial tasks"
on public.commercial_tasks for insert
to authenticated
with check (true);

create policy "assigned users or admins can update commercial tasks"
on public.commercial_tasks for update
to authenticated
using (assigned_to = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner())
with check (assigned_to = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner());
