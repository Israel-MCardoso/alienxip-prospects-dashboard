# AI Architecture Audit

Data: 2026-06-12  
Projeto auditado: `C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard`  
Objetivo: preparar arquitetura futura de IA sem executar chamadas externas, sem ativar produção e sem alterar fluxos produtivos.

## Status Executivo

A base atual já possui os pontos necessários para uma futura camada de IA desacoplada:

- app Next.js em `app-next`;
- Supabase como banco, auth e RLS;
- CRM de prospects com diagnóstico, notas, atividades e pipeline;
- proposta comercial em `prospect_proposals`;
- Knowledge Hub com `wiki_pages` e `playbooks`;
- Outreach Center integrado ao n8n sandbox;
- callbacks auditados em `webhook_audit_logs`;
- fluxo sandbox homologado sem IA paga, Evolution API ou WhatsApp real.

Não foi identificada implementação ativa de provider OpenAI, Claude ou Gemini no código da aplicação. O ponto de entrada futuro deve ser uma camada server-side única, isolada da UI e dos workflows produtivos.

## Stack Identificada

| Área | Evidência |
| --- | --- |
| Frontend/App | Next.js `16.2.7`, React `19.2.4`, TypeScript, Tailwind, shadcn/base-ui |
| Backend | Next.js App Router com API routes |
| Banco | Supabase/Postgres |
| Auth | Supabase Auth via `createSupabaseServerClient` |
| Admin server-side | `createSupabaseAdminClient` |
| Validação | Zod em formulários de prospects |
| Automação | n8n sandbox via `/api/outreach/dispatch` |
| Knowledge | `wiki_pages`, `playbooks`, `files`, `project_wiki_links` |
| Propostas | `prospect_proposals` |

## APIs Mapeadas

| Rota | Função atual | Potencial entrada de IA |
| --- | --- | --- |
| `GET /api/global-search` | Busca global em entidades do OS | Enriquecimento futuro de ranking sem chamada externa por padrão |
| `POST /api/outreach/dispatch` | Envia prospects autenticados ao n8n sandbox/prod source | Futuro ponto de orquestração para SDR, desde que passe pelo AI Brain e budget guard |
| `POST /api/outreach/events` | Recebe callbacks n8n com segredo, dedupe e auditoria | Futuro ponto para resumir conversa e atualizar estado, sempre server-side |

## Tipos e Contratos

Tipos principais em `app-next/src/types/database.ts`:

- `ProspectStatus`;
- `ProspectTemperature`;
- `ProspectSource`;
- `OutreachStatus`;
- `OutreachChannel`;
- `KnowledgeCategory`;
- `KnowledgeStatus`;
- `KnowledgeReviewStatus`;
- `Database`.

Contratos de domínio já existentes:

- `prospects`: lead/prospect comercial;
- `prospect_diagnostics`: diagnóstico digital;
- `prospect_notes`: notas humanas;
- `prospect_activities`: timeline operacional;
- `prospect_proposals`: propostas;
- `prospect_outreach`: estado agregado de automação;
- `outreach_events`: eventos de timeline de outreach;
- `webhook_audit_logs`: auditoria de callback;
- `outreach_batches`: lotes de dispatch;
- `wiki_pages` e `playbooks`: metodologia comercial e operacional.

## Banco e Tabelas Relevantes

### Core comercial

- `profiles`
- `prospects`
- `prospect_diagnostics`
- `prospect_notes`
- `prospect_activities`
- `companies`
- `clients`
- `commercial_tasks`
- `projects`
- `prospect_proposals`

### Conhecimento e playbooks

- `wiki_pages`
- `playbooks`
- `files`
- `project_wiki_links`

### Outreach e n8n

- `prospect_outreach`
- `outreach_events`
- `webhook_audit_logs`
- `outreach_batches`

## Migrations Mapeadas

| Migration | Conteúdo |
| --- | --- |
| `20260608235900_sprint_02_prospects_core.sql` | Prospects, diagnostics, notes, activities, profiles e RLS |
| `20260609010000_sprint_04_commercial_pipeline_clients.sql` | Pipeline comercial, companies, clients |
| `20260609030000_sprint_08_knowledge_hub_storage_search.sql` | Knowledge Hub, wiki/playbooks/files/search |
| `20260611000000_sprint_12_proposals.sql` | `prospect_proposals` |
| `20260611200000_sprint_16_n8n_outreach.sql` | `prospect_outreach`, `outreach_events` |
| `20260611210000_sprint_16_5_webhook_audit.sql` | `webhook_audit_logs` |
| `20260611220000_sprint_18_outreach_hardening.sql` | `outreach_batches` e índices de outreach |

## Fluxos n8n e Integrações

Fluxo homologado atual:

```txt
Usuário autenticado
-> MOTHERXIP UI
-> /api/outreach/dispatch
-> n8n Sandbox
-> /api/outreach/events
-> Supabase
-> Workspace do Prospect + Outreach Center
```

Integrações atuais:

- n8n sandbox por webhook;
- Supabase Auth e Supabase Admin server-side;
- Vercel/Next.js;
- Evolution API presente no ambiente n8n, mas não usada no sandbox homologado;
- nenhum provider real de IA ativo.

## Metodologia ALIENXIP Identificada

A metodologia comercial aparece em `scripts/seed-knowledge.mjs` e no Knowledge Hub:

- Processo Comercial;
- Processo de Prospecção;
- Processo de Diagnóstico Digital;
- Playbook de Prospecção Fria;
- Playbook de Follow-up;
- Playbook de Diagnóstico Digital;
- Playbook de Landing Page;
- Playbook de Sistema Web;
- Playbook de Onboarding;
- Playbook de Incidente;
- Playbook de Postmortem.

O AI Brain futuro deve consumir esses registros como fonte canônica e não criar cadências ou critérios fora do playbook.

## Pontos de Entrada Para IA

| Ponto | Uso futuro | Restrição |
| --- | --- | --- |
| Workspace do prospect | Diagnóstico, qualificação, resumo e proposta | Somente server-side e com provider habilitado |
| `/api/outreach/dispatch` | Geração de abordagem/SDR antes do n8n | Bloqueado por `PROVIDER_ENABLED=false` |
| `/api/outreach/events` | Resumo de conversa e próxima ação | Não chamar IA durante callbacks sem budget guard |
| `prospect_diagnostics` | Fonte para Lead Analyzer | Não sobrescrever análise humana sem revisão |
| `playbooks`/`wiki_pages` | Prompt registry dinâmico futuro | Usar apenas conteúdo aprovado/publicado |
| `prospect_proposals` | Proposal Builder | Gerar brief antes de proposta final |

## Riscos Arquiteturais

- Misturar lógica de IA diretamente em rotas de UI ou callback n8n.
- Permitir provider real sem feature flag explícita.
- Gerar proposta final sem revisão humana.
- Usar Knowledge Hub sem filtro de `status=published` e `review_status=approved`.
- Registrar payloads sensíveis sem sanitização.
- Executar callbacks n8n com chamadas de IA síncronas e sem controle de custo.

## Recomendação

Criar uma camada única `ALIENXIP AI BRAIN`, server-side, desligada por padrão, com provider layer desacoplado, prompt registry versionado, schemas JSON rígidos e tabela futura de `ai_usage_logs` para custo/tokens. A ativação real deve ser uma sprint separada.
