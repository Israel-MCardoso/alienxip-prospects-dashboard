-- Migration: 20260623000003_add_performance_and_sorting_indexes
-- Objetivo: Otimizar o desempenho de joins frequentes de chaves estrangeiras e a ordenação descrescente de listagens paginadas.

-- ============================================================================
-- 1. Índices para a tabela commercial_tasks
-- ============================================================================
CREATE INDEX IF NOT EXISTS commercial_tasks_company_idx ON public.commercial_tasks (company_id);
CREATE INDEX IF NOT EXISTS commercial_tasks_client_idx ON public.commercial_tasks (client_id);
CREATE INDEX IF NOT EXISTS commercial_tasks_created_at_desc_idx ON public.commercial_tasks (created_at DESC);

-- ============================================================================
-- 2. Índices para a tabela prospect_proposals
-- ============================================================================
CREATE INDEX IF NOT EXISTS prospect_proposals_prospect_idx ON public.prospect_proposals (prospect_id);
CREATE INDEX IF NOT EXISTS prospect_proposals_created_by_idx ON public.prospect_proposals (created_by);

-- ============================================================================
-- 3. Índices para tabelas do Tech Center
-- ============================================================================
CREATE INDEX IF NOT EXISTS tech_bugs_client_idx ON public.tech_bugs (client_id);
CREATE INDEX IF NOT EXISTS tech_bugs_company_idx ON public.tech_bugs (company_id);

CREATE INDEX IF NOT EXISTS tech_incidents_project_idx ON public.tech_incidents (project_id);
CREATE INDEX IF NOT EXISTS tech_incidents_client_idx ON public.tech_incidents (client_id);

CREATE INDEX IF NOT EXISTS tech_backlog_items_project_idx ON public.tech_backlog_items (project_id);

CREATE INDEX IF NOT EXISTS tech_roadmap_items_project_idx ON public.tech_roadmap_items (project_id);

CREATE INDEX IF NOT EXISTS technical_decisions_created_by_idx ON public.technical_decisions (created_by);

CREATE INDEX IF NOT EXISTS project_notes_author_idx ON public.project_notes (author_id);

-- ============================================================================
-- 4. Índices para a tabela outreach_batches
-- ============================================================================
CREATE INDEX IF NOT EXISTS outreach_batches_created_by_idx ON public.outreach_batches (created_by);
CREATE INDEX IF NOT EXISTS outreach_batches_created_at_desc_idx ON public.outreach_batches (created_at DESC);

-- ============================================================================
-- 5. Índices de ordenação geral para listas paginadas (created_at DESC)
-- ============================================================================
CREATE INDEX IF NOT EXISTS prospects_created_at_desc_idx ON public.prospects (created_at DESC);
CREATE INDEX IF NOT EXISTS clients_created_at_desc_idx ON public.clients (created_at DESC);
CREATE INDEX IF NOT EXISTS companies_created_at_desc_idx ON public.companies (created_at DESC);
CREATE INDEX IF NOT EXISTS projects_created_at_desc_idx ON public.projects (created_at DESC);
CREATE INDEX IF NOT EXISTS wiki_pages_created_at_desc_idx ON public.wiki_pages (created_at DESC);
CREATE INDEX IF NOT EXISTS playbooks_created_at_desc_idx ON public.playbooks (created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_audit_logs_created_at_desc_idx ON public.webhook_audit_logs (created_at DESC);

-- Índice parcial para listagem e paginação de arquivos não removidos
CREATE INDEX IF NOT EXISTS files_created_at_desc_idx ON public.files (created_at DESC) WHERE removed_at IS NULL;
