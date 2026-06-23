# 08 - Estado, Dados e API

## Fonte principal de dados

O sistema usa Supabase:

- Auth: `@supabase/ssr` e `@supabase/supabase-js`.
- Banco: Postgres via Supabase.
- Tipos: `app-next/src/types/database.ts`.
- Server client: `app-next/src/lib/supabase/server.ts`.
- Browser client: `app-next/src/lib/supabase/browser.ts`.
- Config: `app-next/src/lib/supabase/config.ts`.

## Padrao de acesso a dados

O padrao predominante e:

1. Pagina server component chama funcao `get*Data`.
2. Funcao cria Supabase server client.
3. Query busca dados do banco.
4. Pagina renderiza componente client/server.
5. Mutacoes usam Server Actions.
6. Actions chamam Supabase, gravam dados e fazem `revalidatePath` ou `router.refresh`.

## APIs internas Next

### `/api/global-search`

- Arquivo: `app-next/src/app/api/global-search/route.ts`.
- Funcao: busca global.

### `/api/outreach/dispatch`

- Arquivo: `app-next/src/app/api/outreach/dispatch/route.ts`.
- Funcao: disparar leads para automacao SDR/outreach.
- Usa regras de elegibilidade, provider/servico externo e logs.

### `/api/outreach/events`

- Arquivo: `app-next/src/app/api/outreach/events/route.ts`.
- Funcao: receber eventos externos de outreach/webhook.
- Seguranca: exige `MOTHERXIP_WEBHOOK_SECRET`.

## Services / data modules

- `features/workspace/data.ts`: dashboard, search, activities, overview.
- `features/prospects/data.ts`: prospects, detalhes, workspace do prospect.
- `features/commercial/data.ts`: pipeline, companies, clients.
- `features/operations/data.ts`: tasks, projects, calendar, refs.
- `features/tech/data.ts`: bugs, incidents, backlog, roadmap, decisions, files, notes.
- `features/knowledge/data.ts`: wiki, playbooks, files, search.
- `features/outreach/data.ts`: webhook audit logs e batches.
- `features/governance/data.ts`: governanca.

## Server Actions principais

- `features/auth/actions.ts`: login, reset password, logout.
- `features/prospects/actions.ts`: CRUD prospect, diagnostico, notas, status, temperatura, AI diagnostic, propostas.
- `features/commercial/actions.ts`: tarefas comerciais, conversao de prospect, empresas, clientes.
- `features/operations/actions.ts`: tarefas gerais e projetos.
- `features/tech/actions.ts`: bugs, incidentes, backlog, roadmap, decisoes, notas tecnicas, inline updates.
- `features/knowledge/actions.ts`: wiki, playbooks e upload/remoção de arquivos.
- `features/outreach/actions.ts`: pausar, parar, retomar e testar automacao SDR.
- `features/ai/actions.ts`: chamadas sandbox para AI Brain.

## Estado no cliente

Nao foi encontrado uso de Redux, Zustand ou Context API global.

Estado local com `useState`, `useEffect`, `useMemo`, `useCallback` aparece em:

- `ProspectsCrm`: filtros, drawers, selecao, optimistic UI, modal de envio.
- `PipelineBoard`: prospects locais, drag state, optimistic status.
- `OsShell`: sidebar, tema, menu mobile.
- `SdrCommandCenter`: filtros, selecao, tabs e resumo.
- `TechPages`: edicao inline/modal/local state.

## Dados de CRM

Persistidos no Supabase:

- Leads/prospects: `prospects`.
- Empresas: `companies`.
- Clientes: `clients`.
- Pipeline: `prospects.status`.
- Tarefas: `commercial_tasks`.
- Atividades globais: `activities`.
- Historico prospect: `prospect_activities`.
- Notas: `prospect_notes`.
- Diagnosticos: `prospect_diagnostics`.
- Propostas: `prospect_proposals`.
- Outreach: `prospect_outreach`, `outreach_events`, `outreach_batches`, `webhook_audit_logs`, `outreach_dead_letters`.

## Estrutura de dados

Principais migrations:

- `20260608235900_sprint_02_prospects_core.sql`: profiles, prospects, diagnostics, notes, activities.
- `20260609010000_sprint_04_commercial_pipeline_clients.sql`: companies, clients, commercial_tasks.
- `20260609013000_sprint_05_tasks_projects_calendar.sql`: projects, project_activities.
- `20260609020000_sprint_06_unified_workspace_core.sql`: activities globais.
- `20260609023000_sprint_07_tech_center_reliability.sql`: tech bugs, incidents, backlog, roadmap, decisions, files, project notes.
- `20260609030000_sprint_08_knowledge_hub_storage_search.sql`: wiki, playbooks, project wiki links.
- `20260611000000_sprint_12_proposals.sql`: prospect proposals.
- `20260611200000_sprint_16_n8n_outreach.sql`: prospect outreach e outreach events.
- `20260611210000_sprint_16_5_webhook_audit.sql`: webhook audit logs.
- `20260611220000_sprint_18_outreach_hardening.sql`: outreach batches.
- `20260613090000_sprint_21_outreach_dead_letters.sql`: dead letters.

## Mock / IA

- AI mock provider: `app-next/src/lib/ai/mock-provider.ts`.
- OpenAI provider: `app-next/src/lib/ai/openai-provider.ts`.
- Registry: `app-next/src/lib/ai/registry.ts`.
- Cost guard: `app-next/src/lib/ai/cost-guard.ts`.
- Usage tracker: `app-next/src/lib/ai/usage-tracker.ts`.

Runbook recomenda manter producao em mock/dry-run ate aprovacao.

## Hooks

- Hooks customizados dedicados: Nao encontrado no projeto.
- O projeto usa hooks React diretamente dentro dos componentes.

## Stores

- Zustand/Redux: Nao encontrado no projeto.

## Prisma/Firebase

- Prisma: Nao encontrado no projeto.
- Firebase: Nao encontrado no projeto.

## Arquivos de mock

- `MockAIProvider` para IA.
- Testes em `tests/*.mjs` usam fixtures/logica local.
- Mock de outreach sandbox aparece por flags e fluxo SDR, nao como store unica.
