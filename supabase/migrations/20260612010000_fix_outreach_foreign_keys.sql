-- Migration: Fix outreach foreign keys for PostgREST relationship discovery
-- Some outreach tables already existed before Sprint 16 migrations ran, so
-- `create table if not exists` did not attach the declared foreign keys.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'prospect_outreach_prospect_id_fkey'
      and conrelid = 'public.prospect_outreach'::regclass
  ) then
    alter table public.prospect_outreach
      add constraint prospect_outreach_prospect_id_fkey
      foreign key (prospect_id)
      references public.prospects(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'outreach_events_prospect_id_fkey'
      and conrelid = 'public.outreach_events'::regclass
  ) then
    alter table public.outreach_events
      add constraint outreach_events_prospect_id_fkey
      foreign key (prospect_id)
      references public.prospects(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'outreach_events_outreach_id_fkey'
      and conrelid = 'public.outreach_events'::regclass
  ) then
    alter table public.outreach_events
      add constraint outreach_events_outreach_id_fkey
      foreign key (outreach_id)
      references public.prospect_outreach(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'outreach_batches_created_by_fkey'
      and conrelid = 'public.outreach_batches'::regclass
  ) then
    alter table public.outreach_batches
      add constraint outreach_batches_created_by_fkey
      foreign key (created_by)
      references public.profiles(id)
      on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
