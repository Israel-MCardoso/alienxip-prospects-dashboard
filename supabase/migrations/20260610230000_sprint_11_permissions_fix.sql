-- Migration: 20260610230000_sprint_11_permissions_fix
-- Focus: Fix permission denied errors, ensure proper grants, configure roles-based RLS, and add auto-profile signup trigger.

-- 1. Ensure usage on schema public
grant usage on schema public to authenticated, anon, service_role;

-- 2. Grant table and sequence permissions to authenticated and service_role
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select, update on all sequences in schema public to authenticated, service_role;

-- 3. Define helper functions with security definer to bypass profile recursion issues
create or replace function public.has_active_profile()
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
      and is_active = true
  );
$$;

create or replace function public.is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'viewer' from public.profiles where id = auth.uid() and is_active = true),
    false
  );
$$;

-- Trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member', -- default role
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Recreate RLS policies for prospects and metadata
drop policy if exists "authenticated users can read prospects" on public.prospects;
drop policy if exists "authenticated users can create prospects" on public.prospects;
drop policy if exists "authenticated users can update prospects" on public.prospects;
drop policy if exists "admins can delete prospects" on public.prospects;

create policy "authenticated users can read prospects"
on public.prospects for select
to authenticated
using (true);

create policy "authenticated users can create prospects"
on public.prospects for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "authenticated users can update prospects"
on public.prospects for update
to authenticated
using (public.has_active_profile() and not public.is_viewer())
with check (public.has_active_profile() and not public.is_viewer());

create policy "admins can delete prospects"
on public.prospects for delete
to authenticated
using (public.is_admin_or_owner());

-- prospect_diagnostics
drop policy if exists "authenticated users can read diagnostics" on public.prospect_diagnostics;
drop policy if exists "authenticated users can create diagnostics" on public.prospect_diagnostics;
drop policy if exists "authenticated users can update diagnostics" on public.prospect_diagnostics;

create policy "authenticated users can read diagnostics"
on public.prospect_diagnostics for select
to authenticated
using (true);

create policy "authenticated users can create diagnostics"
on public.prospect_diagnostics for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "authenticated users can update diagnostics"
on public.prospect_diagnostics for update
to authenticated
using (public.has_active_profile() and not public.is_viewer())
with check (public.has_active_profile() and not public.is_viewer());

-- prospect_notes
drop policy if exists "authenticated users can read notes" on public.prospect_notes;
drop policy if exists "authenticated users can create notes" on public.prospect_notes;
drop policy if exists "authenticated users can update notes" on public.prospect_notes;

create policy "authenticated users can read notes"
on public.prospect_notes for select
to authenticated
using (true);

create policy "authenticated users can create notes"
on public.prospect_notes for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "authenticated users can update notes"
on public.prospect_notes for update
to authenticated
using (public.has_active_profile() and not public.is_viewer() and (author_id = auth.uid() or public.is_admin_or_owner()))
with check (public.has_active_profile() and not public.is_viewer() and (author_id = auth.uid() or public.is_admin_or_owner()));

-- prospect_activities
drop policy if exists "authenticated users can read activities" on public.prospect_activities;
drop policy if exists "authenticated users can create activities" on public.prospect_activities;
drop policy if exists "authenticated users can read prospect activities" on public.prospect_activities;
drop policy if exists "authenticated users can create prospect activities" on public.prospect_activities;

create policy "authenticated users can read prospect activities"
on public.prospect_activities for select
to authenticated
using (true);

create policy "authenticated users can create prospect activities"
on public.prospect_activities for insert
to authenticated
with check (true);

-- 5. Recreate RLS policies for companies and clients
drop policy if exists "authenticated users can read companies" on public.companies;
drop policy if exists "authenticated users can create companies" on public.companies;
drop policy if exists "authenticated users can update companies" on public.companies;

create policy "authenticated users can read companies"
on public.companies for select
to authenticated
using (true);

create policy "authenticated users can create companies"
on public.companies for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "authenticated users can update companies"
on public.companies for update
to authenticated
using (public.has_active_profile() and not public.is_viewer())
with check (public.has_active_profile() and not public.is_viewer());

-- clients
drop policy if exists "authenticated users can read clients" on public.clients;
drop policy if exists "authenticated users can create clients" on public.clients;
drop policy if exists "authenticated users can update clients" on public.clients;

create policy "authenticated users can read clients"
on public.clients for select
to authenticated
using (true);

create policy "authenticated users can create clients"
on public.clients for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "authenticated users can update clients"
on public.clients for update
to authenticated
using (public.has_active_profile() and not public.is_viewer())
with check (public.has_active_profile() and not public.is_viewer());

-- 6. Recreate RLS policies for tasks and projects
drop policy if exists "authenticated users can read commercial tasks" on public.commercial_tasks;
drop policy if exists "authenticated users can create commercial tasks" on public.commercial_tasks;
drop policy if exists "assigned users or admins can update commercial tasks" on public.commercial_tasks;

create policy "authenticated users can read commercial tasks"
on public.commercial_tasks for select
to authenticated
using (true);

create policy "authenticated users can create commercial tasks"
on public.commercial_tasks for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "users can update commercial tasks"
on public.commercial_tasks for update
to authenticated
using (public.has_active_profile() and not public.is_viewer() and (assigned_to = auth.uid() or created_by = auth.uid() or owner_id = auth.uid() or public.is_admin_or_owner()))
with check (public.has_active_profile() and not public.is_viewer() and (assigned_to = auth.uid() or created_by = auth.uid() or owner_id = auth.uid() or public.is_admin_or_owner()));

-- projects
drop policy if exists "authenticated users can read projects" on public.projects;
drop policy if exists "authenticated users can create projects" on public.projects;
drop policy if exists "owners creators or admins can update projects" on public.projects;
drop policy if exists "users can update projects" on public.projects;

create policy "authenticated users can read projects"
on public.projects for select
to authenticated
using (true);

create policy "authenticated users can create projects"
on public.projects for insert
to authenticated
with check (public.has_active_profile() and not public.is_viewer());

create policy "users can update projects"
on public.projects for update
to authenticated
using (public.has_active_profile() and not public.is_viewer() and (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()))
with check (public.has_active_profile() and not public.is_viewer() and (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()));

-- project_activities
drop policy if exists "authenticated users can read project activities" on public.project_activities;
drop policy if exists "authenticated users can create project activities" on public.project_activities;

create policy "authenticated users can read project activities"
on public.project_activities for select
to authenticated
using (true);

create policy "authenticated users can create project activities"
on public.project_activities for insert
to authenticated
with check (true);

-- activities
drop policy if exists "authenticated users can read activities" on public.activities;
drop policy if exists "authenticated users can create activities" on public.activities;

create policy "authenticated users can read activities"
on public.activities for select
to authenticated
using (true);

create policy "authenticated users can create activities"
on public.activities for insert
to authenticated
with check (true);

-- 7. Recreate RLS policies for tech center
-- tech_bugs
drop policy if exists "authenticated users can read tech bugs" on public.tech_bugs;
drop policy if exists "authenticated users can create tech bugs" on public.tech_bugs;
drop policy if exists "owner assigned reporter or admin can update tech bugs" on public.tech_bugs;
drop policy if exists "users can update tech bugs" on public.tech_bugs;

create policy "authenticated users can read tech bugs" on public.tech_bugs for select to authenticated using (true);
create policy "authenticated users can create tech bugs" on public.tech_bugs for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update tech bugs" on public.tech_bugs for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (assigned_to = auth.uid() or reported_by = auth.uid() or public.is_admin_or_owner()));

-- tech_incidents
drop policy if exists "authenticated users can read incidents" on public.tech_incidents;
drop policy if exists "authenticated users can create incidents" on public.tech_incidents;
drop policy if exists "owner creator or admin can update incidents" on public.tech_incidents;
drop policy if exists "users can update incidents" on public.tech_incidents;

create policy "authenticated users can read incidents" on public.tech_incidents for select to authenticated using (true);
create policy "authenticated users can create incidents" on public.tech_incidents for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update incidents" on public.tech_incidents for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()));

-- tech_backlog_items
drop policy if exists "authenticated users can read tech backlog" on public.tech_backlog_items;
drop policy if exists "authenticated users can create tech backlog" on public.tech_backlog_items;
drop policy if exists "owner creator or admin can update tech backlog" on public.tech_backlog_items;
drop policy if exists "users can update tech backlog" on public.tech_backlog_items;

create policy "authenticated users can read tech backlog" on public.tech_backlog_items for select to authenticated using (true);
create policy "authenticated users can create tech backlog" on public.tech_backlog_items for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update tech backlog" on public.tech_backlog_items for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()));

-- tech_roadmap_items
drop policy if exists "authenticated users can read tech roadmap" on public.tech_roadmap_items;
drop policy if exists "authenticated users can create tech roadmap" on public.tech_roadmap_items;
drop policy if exists "owner creator or admin can update tech roadmap" on public.tech_roadmap_items;
drop policy if exists "users can update tech roadmap" on public.tech_roadmap_items;

create policy "authenticated users can read tech roadmap" on public.tech_roadmap_items for select to authenticated using (true);
create policy "authenticated users can create tech roadmap" on public.tech_roadmap_items for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update tech roadmap" on public.tech_roadmap_items for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (owner_id = auth.uid() or created_by = auth.uid() or public.is_admin_or_owner()));

-- technical_decisions
drop policy if exists "authenticated users can read technical decisions" on public.technical_decisions;
drop policy if exists "authenticated users can create technical decisions" on public.technical_decisions;
drop policy if exists "creator or admin can update technical decisions" on public.technical_decisions;
drop policy if exists "users can update technical decisions" on public.technical_decisions;

create policy "authenticated users can read technical decisions" on public.technical_decisions for select to authenticated using (true);
create policy "authenticated users can create technical decisions" on public.technical_decisions for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update technical decisions" on public.technical_decisions for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (created_by = auth.uid() or public.is_admin_or_owner()));

-- project_notes
drop policy if exists "authenticated users can read project notes" on public.project_notes;
drop policy if exists "authenticated users can create project notes" on public.project_notes;
drop policy if exists "author or admin can update project notes" on public.project_notes;
drop policy if exists "users can update project notes" on public.project_notes;

create policy "authenticated users can read project notes" on public.project_notes for select to authenticated using (true);
create policy "authenticated users can create project notes" on public.project_notes for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update project notes" on public.project_notes for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (author_id = auth.uid() or public.is_admin_or_owner()));

-- 8. Recreate RLS policies for knowledge hub
-- wiki_pages
drop policy if exists "authenticated users can read published wiki" on public.wiki_pages;
drop policy if exists "authenticated users can create wiki" on public.wiki_pages;
drop policy if exists "creator or admin can update wiki" on public.wiki_pages;
drop policy if exists "users can update wiki" on public.wiki_pages;

create policy "authenticated users can read wiki" on public.wiki_pages for select to authenticated using (true);
create policy "authenticated users can create wiki" on public.wiki_pages for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update wiki" on public.wiki_pages for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner()));

-- playbooks
drop policy if exists "authenticated users can read published playbooks" on public.playbooks;
drop policy if exists "authenticated users can create playbooks" on public.playbooks;
drop policy if exists "creator or admin can update playbooks" on public.playbooks;
drop policy if exists "users can update playbooks" on public.playbooks;

create policy "authenticated users can read playbooks" on public.playbooks for select to authenticated using (true);
create policy "authenticated users can create playbooks" on public.playbooks for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update playbooks" on public.playbooks for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (created_by = auth.uid() or updated_by = auth.uid() or public.is_admin_or_owner()));

-- project_wiki_links
drop policy if exists "authenticated users can read project wiki links" on public.project_wiki_links;
drop policy if exists "authenticated users can create project wiki links" on public.project_wiki_links;

create policy "authenticated users can read project wiki links" on public.project_wiki_links for select to authenticated using (true);
create policy "authenticated users can create project wiki links" on public.project_wiki_links for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());

-- files
drop policy if exists "authenticated users can read files" on public.files;
drop policy if exists "authenticated users can read active files" on public.files;
drop policy if exists "uploader or admin can update files" on public.files;
drop policy if exists "operator uploader or admin can update files" on public.files;
drop policy if exists "authenticated users can register files" on public.files;
drop policy if exists "users can update files" on public.files;

create policy "authenticated users can read active files" on public.files for select to authenticated using (removed_at is null or uploaded_by = auth.uid() or public.is_admin_or_owner());
create policy "authenticated users can create files" on public.files for insert to authenticated with check (public.has_active_profile() and not public.is_viewer());
create policy "users can update files" on public.files for update to authenticated using (public.has_active_profile() and not public.is_viewer() and (uploaded_by = auth.uid() or public.has_app_role('operator') or public.is_admin_or_owner()));
