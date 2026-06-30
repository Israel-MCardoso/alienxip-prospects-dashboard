-- Optional textual company/business name for a prospect.
-- Nullable on purpose: many prospects have no identified company yet.
-- No backfill: partner_name is a referral partner, not the prospect's own
-- company, and converted_company_id is a relational FK — neither is a safe
-- text source. No RLS/policy changes. Idempotent: safe to run more than once.
alter table public.prospects
  add column if not exists company_name text;

comment on column public.prospects.company_name is 'Nome textual da empresa ou negócio associado ao prospect antes da conversão para company/client.';
