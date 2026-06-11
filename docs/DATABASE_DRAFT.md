# ALIENXIP OS Database Draft

## 1. Principios

Banco recomendado: Supabase Postgres.

Principios:

- UUID como chave primaria.
- `created_at` e `updated_at` em todas as tabelas operacionais.
- `created_by` e `updated_by` quando houver acao humana.
- RLS habilitada desde o inicio.
- Soft delete com `archived_at` ou `deleted_at` quando necessario.
- Dados brutos de importacao preservados em `raw_payload`.
- Atividades relevantes registradas em `activities`.

Tipos sugeridos:

```sql
create type app_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
create type priority_level as enum ('low', 'medium', 'high', 'urgent');
create type prospect_status as enum ('new', 'qualified', 'contacted', 'meeting_scheduled', 'proposal_sent', 'won', 'lost', 'archived');
create type project_status as enum ('planning', 'active', 'paused', 'done', 'archived');
create type task_status as enum ('backlog', 'todo', 'in_progress', 'review', 'done', 'blocked', 'archived');
create type bug_status as enum ('open', 'triaged', 'in_progress', 'fixed', 'closed', 'wont_fix');
create type roadmap_status as enum ('idea', 'planned', 'in_progress', 'shipped', 'cancelled');
```

## 2. profiles

Perfil interno ligado a `auth.users`.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  role app_role not null default 'member',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indices:

```sql
create index profiles_role_idx on profiles(role);
create index profiles_active_idx on profiles(is_active);
```

## 3. prospects

Base de oportunidades comerciais.

```sql
create table prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  segment text,
  segment_raw text,
  address text,
  city text,
  state text,
  country text default 'BR',
  latitude numeric,
  longitude numeric,
  phone text,
  website_url text,
  social_url text,
  whatsapp_url text,
  rating numeric,
  rating_count integer,
  priority priority_level not null default 'medium',
  priority_score integer not null default 0,
  priority_reasons jsonb not null default '[]'::jsonb,
  suggested_offer text,
  next_step text,
  status prospect_status not null default 'new',
  owner_id uuid references profiles(id),
  company_id uuid,
  source text not null default 'manual',
  source_external_id text,
  source_row_hash text,
  import_batch_id uuid,
  raw_payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indices:

```sql
create index prospects_status_idx on prospects(status);
create index prospects_priority_idx on prospects(priority);
create index prospects_owner_idx on prospects(owner_id);
create index prospects_city_idx on prospects(city);
create unique index prospects_source_hash_unique on prospects(source, source_row_hash) where source_row_hash is not null;
```

## 4. prospect_notes

Notas humanas sobre prospects.

```sql
create table prospect_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  body text not null,
  is_pinned boolean not null default false,
  created_by uuid not null references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 5. prospect_diagnostics

Diagnosticos comerciais ou tecnicos feitos para um prospect.

```sql
create table prospect_diagnostics (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  title text not null,
  summary text,
  pain_points jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  recommended_offer text,
  score integer,
  status text not null default 'draft',
  created_by uuid not null references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 6. prospect_messages

Mensagens planejadas ou enviadas para prospects.

```sql
create table prospect_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  channel text not null,
  direction text not null default 'outbound',
  subject text,
  body text not null,
  status text not null default 'draft',
  sent_at timestamptz,
  external_url text,
  created_by uuid not null references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospect_messages_channel_check check (channel in ('whatsapp', 'email', 'phone', 'instagram', 'linkedin', 'other')),
  constraint prospect_messages_direction_check check (direction in ('inbound', 'outbound'))
);
```

## 7. companies

Empresas conhecidas, antes ou depois de virarem clientes.

```sql
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  segment text,
  website_url text,
  phone text,
  email text,
  city text,
  state text,
  country text default 'BR',
  notes text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Relacionamento recomendado depois da criacao das duas tabelas:

```sql
alter table prospects
  add constraint prospects_company_id_fkey
  foreign key (company_id) references companies(id);
```

## 8. clients

Clientes ativos ou antigos.

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  owner_id uuid references profiles(id),
  status text not null default 'active',
  start_date date,
  end_date date,
  monthly_value numeric,
  contract_url text,
  notes text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_status_check check (status in ('active', 'paused', 'former', 'prospective'))
);
```

## 9. projects

Projetos internos ou de clientes.

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  name text not null,
  description text,
  status project_status not null default 'planning',
  priority priority_level not null default 'medium',
  owner_id uuid references profiles(id),
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 10. sprints

Ciclos de trabalho.

```sql
create table sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  status text not null default 'planned',
  starts_on date,
  ends_on date,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sprints_status_check check (status in ('planned', 'active', 'closed', 'cancelled'))
);
```

## 11. tasks

Unidade de trabalho.

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  sprint_id uuid references sprints(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'backlog',
  priority priority_level not null default 'medium',
  assignee_id uuid references profiles(id),
  due_date date,
  completed_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indices:

```sql
create index tasks_project_idx on tasks(project_id);
create index tasks_sprint_idx on tasks(sprint_id);
create index tasks_assignee_idx on tasks(assignee_id);
create index tasks_status_idx on tasks(status);
```

## 12. bugs

Problemas tecnicos ou operacionais.

```sql
create table bugs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  title text not null,
  description text,
  status bug_status not null default 'open',
  severity priority_level not null default 'medium',
  reporter_id uuid references profiles(id),
  assignee_id uuid references profiles(id),
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  fixed_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 13. roadmap_items

Itens estrategicos do produto/operacao.

```sql
create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status roadmap_status not null default 'idea',
  priority priority_level not null default 'medium',
  owner_id uuid references profiles(id),
  target_quarter text,
  project_id uuid references projects(id) on delete set null,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 14. wiki_pages

Base de conhecimento.

```sql
create table wiki_pages (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references wiki_pages(id) on delete set null,
  title text not null,
  slug text not null unique,
  content_md text not null default '',
  status text not null default 'draft',
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wiki_pages_status_check check (status in ('draft', 'published', 'archived'))
);
```

## 15. files

Metadados para arquivos no Supabase Storage.

```sql
create table files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  owner_id uuid references profiles(id),
  prospect_id uuid references prospects(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  wiki_page_id uuid references wiki_pages(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique(bucket, path)
);
```

## 16. activities

Log de eventos importantes.

```sql
create table activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Indices:

```sql
create index activities_actor_idx on activities(actor_id);
create index activities_entity_idx on activities(entity_type, entity_id);
create index activities_created_at_idx on activities(created_at desc);
```

## 17. Importacao da Google Sheet

Tabela opcional para rastrear lotes de importacao.

```sql
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text,
  status text not null default 'running',
  rows_seen integer not null default 0,
  rows_inserted integer not null default 0,
  rows_updated integer not null default 0,
  rows_skipped integer not null default 0,
  error_message text,
  started_by uuid references profiles(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint import_batches_status_check check (status in ('running', 'succeeded', 'failed', 'cancelled'))
);
```

Uso:

- Cada importacao cria um `import_batch`.
- Cada prospect importado recebe `import_batch_id`.
- Rollback pode remover ou arquivar registros por lote.

## 18. RLS Inicial

Politica inicial recomendada:

- `viewer`: leitura em tabelas operacionais.
- `member`: leitura e criacao limitada.
- `manager`: leitura, criacao e edicao de CRM/projetos.
- `admin`: acesso operacional completo.
- `owner`: acesso total.

Funcoes auxiliares sugeridas:

```sql
create or replace function current_user_role()
returns app_role
language sql
security definer
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin_or_owner()
returns boolean
language sql
security definer
as $$
  select current_user_role() in ('admin', 'owner')
$$;
```

Exemplo de politica:

```sql
alter table prospects enable row level security;

create policy "authenticated users can read prospects"
on prospects for select
to authenticated
using (current_user_role() in ('owner', 'admin', 'manager', 'member', 'viewer'));

create policy "managers can manage prospects"
on prospects for all
to authenticated
using (current_user_role() in ('owner', 'admin', 'manager'))
with check (current_user_role() in ('owner', 'admin', 'manager'));
```

## 19. Ordem Recomendada das Migrations

1. Enums.
2. `profiles`.
3. Funcoes auxiliares de role.
4. `companies`.
5. `prospects`.
6. `prospect_notes`, `prospect_diagnostics`, `prospect_messages`.
7. `clients`.
8. `projects`, `sprints`, `tasks`, `bugs`.
9. `roadmap_items`, `wiki_pages`, `files`.
10. `activities`.
11. `import_batches`.
12. RLS e policies.

## 20. Pendencias de Decisao

- Confirmar se havera apenas uma organizacao interna ou multiplas organizacoes no futuro.
- Definir se clientes terao acesso externo ao sistema.
- Definir politica de retencao de arquivos.
- Definir se mensagens serao apenas registradas manualmente ou integradas com WhatsApp/email.
- Definir campos financeiros obrigatorios para clientes e projetos.
