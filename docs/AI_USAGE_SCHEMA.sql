-- ALIENXIP AI BRAIN - usage logs draft
-- Status: draft only. Do not apply without explicit approval.
-- Purpose: prepare future token and cost tracking for AI providers.

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  tokens_input integer not null default 0 check (tokens_input >= 0),
  tokens_output integer not null default 0 check (tokens_output >= 0),
  cost numeric(12, 6) not null default 0 check (cost >= 0),
  conversation_id text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_created_at_idx
on public.ai_usage_logs (created_at desc);

create index if not exists ai_usage_logs_conversation_id_idx
on public.ai_usage_logs (conversation_id)
where conversation_id is not null;

create index if not exists ai_usage_logs_provider_model_idx
on public.ai_usage_logs (provider, model);

alter table public.ai_usage_logs enable row level security;

drop policy if exists "admins can read ai usage logs" on public.ai_usage_logs;
create policy "admins can read ai usage logs"
on public.ai_usage_logs for select
to authenticated
using (public.is_admin_or_owner());

-- Inserts should be performed by server-side service role only.
grant select on public.ai_usage_logs to authenticated;
grant select, insert on public.ai_usage_logs to service_role;
