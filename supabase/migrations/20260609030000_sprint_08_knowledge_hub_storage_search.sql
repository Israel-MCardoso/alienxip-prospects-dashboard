create type public.knowledge_status as enum ('draft', 'published', 'archived');
create type public.knowledge_category as enum ('vendas', 'prospeccao', 'desenvolvimento', 'design', 'operacao', 'suporte', 'financeiro', 'geral');

create table public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  category public.knowledge_category not null default 'geral',
  status public.knowledge_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text not null,
  category public.knowledge_category not null default 'geral',
  status public.knowledge_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_wiki_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  wiki_page_id uuid not null references public.wiki_pages(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, wiki_page_id)
);

create index wiki_pages_status_idx on public.wiki_pages(status);
create index wiki_pages_category_idx on public.wiki_pages(category);
create index wiki_pages_search_idx on public.wiki_pages using gin (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, '')));
create index playbooks_status_idx on public.playbooks(status);
create index playbooks_category_idx on public.playbooks(category);
create index playbooks_search_idx on public.playbooks using gin (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, '')));
create index project_wiki_links_project_idx on public.project_wiki_links(project_id);
create index files_name_idx on public.files(file_name);

create trigger wiki_pages_set_updated_at before update on public.wiki_pages for each row execute function public.set_updated_at();
create trigger playbooks_set_updated_at before update on public.playbooks for each row execute function public.set_updated_at();

alter table public.wiki_pages enable row level security;
alter table public.playbooks enable row level security;
alter table public.project_wiki_links enable row level security;

create policy "authenticated users can read published wiki"
on public.wiki_pages for select
to authenticated
using (status = 'published' or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can create wiki"
on public.wiki_pages for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin_or_owner());

create policy "creator or admin can update wiki"
on public.wiki_pages for update
to authenticated
using (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner())
with check (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read published playbooks"
on public.playbooks for select
to authenticated
using (status = 'published' or created_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can create playbooks"
on public.playbooks for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin_or_owner());

create policy "creator or admin can update playbooks"
on public.playbooks for update
to authenticated
using (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner())
with check (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner());

create policy "authenticated users can read project wiki links"
on public.project_wiki_links for select
to authenticated
using (true);

create policy "authenticated users can create project wiki links"
on public.project_wiki_links for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin_or_owner());

create policy "uploader or admin can update files"
on public.files for update
to authenticated
using (uploaded_by = auth.uid() or public.is_admin_or_owner())
with check (uploaded_by = auth.uid() or public.is_admin_or_owner());
