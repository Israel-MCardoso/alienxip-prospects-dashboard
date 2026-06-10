create type public.knowledge_review_status as enum ('needs_review', 'approved', 'outdated');

alter type public.app_role add value if not exists 'operator';

alter table public.wiki_pages
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_status public.knowledge_review_status not null default 'needs_review';

alter table public.playbooks
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_status public.knowledge_review_status not null default 'needs_review';

alter table public.files
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid references public.profiles(id) on delete set null,
  add column if not exists removal_reason text;

create index if not exists wiki_pages_review_status_idx on public.wiki_pages(review_status);
create index if not exists playbooks_review_status_idx on public.playbooks(review_status);
create index if not exists files_removed_at_idx on public.files(removed_at);

create or replace function public.has_app_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role::text = required_role
        or role::text in ('owner', 'admin')
      )
      and is_active = true
  );
$$;

create or replace function public.global_search(search_query text, result_limit integer default 20)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  url text,
  rank real,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select plainto_tsquery('portuguese', coalesce(search_query, '')) as query
  ),
  results as (
    select 'prospect'::text, p.id, p.name, coalesce(p.segment, p.status::text), '/os/prospects/' || p.id::text, ts_rank(to_tsvector('portuguese', coalesce(p.name, '') || ' ' || coalesce(p.segment, '') || ' ' || coalesce(p.notes, '')), q.query), p.created_at
    from public.prospects p, q
    where q.query @@ to_tsvector('portuguese', coalesce(p.name, '') || ' ' || coalesce(p.segment, '') || ' ' || coalesce(p.notes, ''))
    union all
    select 'company', c.id, c.name, coalesce(c.segment, 'Empresa'), '/os/companies/' || c.id::text, ts_rank(to_tsvector('portuguese', coalesce(c.name, '') || ' ' || coalesce(c.segment, '') || ' ' || coalesce(c.notes, '')), q.query), c.created_at
    from public.companies c, q
    where q.query @@ to_tsvector('portuguese', coalesce(c.name, '') || ' ' || coalesce(c.segment, '') || ' ' || coalesce(c.notes, ''))
    union all
    select 'client', cl.id, coalesce(cl.main_contact_name, cl.id::text), coalesce(cl.contract_status::text, 'Cliente'), '/os/clients/' || cl.id::text, ts_rank(to_tsvector('portuguese', coalesce(cl.main_contact_name, '') || ' ' || coalesce(cl.main_contact_email, '')), q.query), cl.created_at
    from public.clients cl, q
    where q.query @@ to_tsvector('portuguese', coalesce(cl.main_contact_name, '') || ' ' || coalesce(cl.main_contact_email, ''))
    union all
    select 'project', pr.id, pr.name, coalesce(pr.status::text, 'Projeto'), '/os/projects/' || pr.id::text, ts_rank(to_tsvector('portuguese', coalesce(pr.name, '') || ' ' || coalesce(pr.description, '')), q.query), pr.created_at
    from public.projects pr, q
    where q.query @@ to_tsvector('portuguese', coalesce(pr.name, '') || ' ' || coalesce(pr.description, ''))
    union all
    select 'task', t.id, t.title, coalesce(t.status::text, 'Task'), coalesce('/os/projects/' || t.project_id::text, '/os/tasks'), ts_rank(to_tsvector('portuguese', coalesce(t.title, '') || ' ' || coalesce(t.description, '')), q.query), t.created_at
    from public.commercial_tasks t, q
    where q.query @@ to_tsvector('portuguese', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
    union all
    select 'bug', b.id, b.title, b.severity::text, '/os/tech/bugs', ts_rank(to_tsvector('portuguese', coalesce(b.title, '') || ' ' || coalesce(b.description, '')), q.query), b.created_at
    from public.tech_bugs b, q
    where q.query @@ to_tsvector('portuguese', coalesce(b.title, '') || ' ' || coalesce(b.description, ''))
    union all
    select 'incident', i.id, i.title, i.severity::text, '/os/tech/incidents', ts_rank(to_tsvector('portuguese', coalesce(i.title, '') || ' ' || coalesce(i.description, '')), q.query), i.created_at
    from public.tech_incidents i, q
    where q.query @@ to_tsvector('portuguese', coalesce(i.title, '') || ' ' || coalesce(i.description, ''))
    union all
    select 'backlog', bl.id, bl.title, bl.type::text, '/os/tech/backlog', ts_rank(to_tsvector('portuguese', coalesce(bl.title, '') || ' ' || coalesce(bl.description, '')), q.query), bl.created_at
    from public.tech_backlog_items bl, q
    where q.query @@ to_tsvector('portuguese', coalesce(bl.title, '') || ' ' || coalesce(bl.description, ''))
    union all
    select 'roadmap', r.id, r.title, r.status::text, '/os/tech/roadmap', ts_rank(to_tsvector('portuguese', coalesce(r.title, '') || ' ' || coalesce(r.description, '')), q.query), r.created_at
    from public.tech_roadmap_items r, q
    where q.query @@ to_tsvector('portuguese', coalesce(r.title, '') || ' ' || coalesce(r.description, ''))
    union all
    select 'technical_decision', d.id, d.title, d.status::text, '/os/tech/decisions', ts_rank(to_tsvector('portuguese', coalesce(d.title, '') || ' ' || coalesce(d.context, '') || ' ' || coalesce(d.decision, '')), q.query), d.created_at
    from public.technical_decisions d, q
    where q.query @@ to_tsvector('portuguese', coalesce(d.title, '') || ' ' || coalesce(d.context, '') || ' ' || coalesce(d.decision, ''))
    union all
    select 'wiki', w.id, w.title, w.category::text, '/os/wiki/' || w.slug, ts_rank(to_tsvector('portuguese', coalesce(w.title, '') || ' ' || coalesce(w.content, '')), q.query), w.created_at
    from public.wiki_pages w, q
    where q.query @@ to_tsvector('portuguese', coalesce(w.title, '') || ' ' || coalesce(w.content, ''))
    union all
    select 'playbook', pb.id, pb.title, pb.category::text, '/os/playbooks/' || pb.id::text, ts_rank(to_tsvector('portuguese', coalesce(pb.title, '') || ' ' || coalesce(pb.description, '') || ' ' || coalesce(pb.content, '')), q.query), pb.created_at
    from public.playbooks pb, q
    where q.query @@ to_tsvector('portuguese', coalesce(pb.title, '') || ' ' || coalesce(pb.description, '') || ' ' || coalesce(pb.content, ''))
    union all
    select 'file', f.id, f.file_name, coalesce(f.entity_type, 'Arquivo'), '/os/files', ts_rank(to_tsvector('portuguese', coalesce(f.file_name, '') || ' ' || coalesce(f.file_type, '')), q.query), f.created_at
    from public.files f, q
    where f.removed_at is null and q.query @@ to_tsvector('portuguese', coalesce(f.file_name, '') || ' ' || coalesce(f.file_type, ''))
  )
  select * from results
  order by rank desc, created_at desc
  limit least(result_limit, 50);
$$;

drop policy if exists "authenticated users can read files" on public.files;
create policy "authenticated users can read active files"
on public.files for select
to authenticated
using (removed_at is null or uploaded_by = auth.uid() or public.is_admin_or_owner());

drop policy if exists "uploader or admin can update files" on public.files;
create policy "operator uploader or admin can update files"
on public.files for update
to authenticated
using (uploaded_by = auth.uid() or public.has_app_role('operator') or public.is_admin_or_owner())
with check (uploaded_by = auth.uid() or public.has_app_role('operator') or public.is_admin_or_owner());
