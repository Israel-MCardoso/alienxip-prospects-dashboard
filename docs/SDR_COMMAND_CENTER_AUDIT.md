# SDR Command Center Audit

Data: 2026-06-13

## Escopo Auditado

Repositório auditado: `C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard`.

O objetivo foi localizar as estruturas existentes de Prospects, Outreach, Outreach Center, Prospect Workspace, AI Brain, batches e audit logs para integrar o SDR Command Center sem duplicar módulos e sem ativar produção.

## Rotas Existentes

- `/os/outreach`: `app-next/src/app/os/(protected)/outreach/page.tsx`
  - Carrega `getProspects()`, `getWebhookAuditLogs()` e `getOutreachBatches()`.
  - Renderiza `OutreachCenter`.
- `/os/outreach/settings`: `app-next/src/app/os/(protected)/outreach/settings/page.tsx`
  - Renderiza `OutreachSettingsPanel`.
- `/os/prospects/[id]`: workspace autenticado do prospect.
  - Integra dados de CRM, outreach e AI Brain sandbox.
- `/api/outreach/dispatch`: endpoint interno de dispatch sandbox/protegido.
- `/api/outreach/events`: endpoint interno de callback n8n para eventos.

## Módulos e Componentes Reutilizáveis

- `app-next/src/features/outreach/outreach-center.tsx`
  - Centro operacional existente para automação, batches, monitoramento e logs.
- `app-next/src/features/outreach/data.ts`
  - Leitura de `webhook_audit_logs` e `outreach_batches`.
- `app-next/src/features/outreach/actions.ts`
  - Ações existentes de pausa, parada, retomada e dispatch.
- `app-next/src/features/prospects/data.ts`
  - Leitura de prospects com `prospect_outreach`.
- `app-next/src/features/prospects/prospect-workspace.tsx`
  - Workspace do prospect com abas operacionais e AI Brain sandbox.
- `app-next/src/features/ai/ai-brain-panel.tsx`
  - Painel AI Brain sandbox já homologado.
- `app-next/src/components/ui/*`
  - Cards, badges, botões, inputs, tabelas e controles visuais.

## Dados Existentes

Tabelas e estruturas já usadas pelo sistema:

- `prospects`
- `prospect_outreach`
- `outreach_events`
- `outreach_batches`
- `webhook_audit_logs`
- `profiles`

Nenhuma migration nova foi necessária para esta sprint.

## Integrações Existentes

- n8n sandbox via `/api/outreach/dispatch` e `/api/outreach/events`.
- Supabase autenticado para leitura de CRM/outreach.
- AI Brain sandbox com `MockAIProvider`.
- Evolution API preparada em modo sandbox/bloqueado, sem provider ativo.
- OpenAI preparada em zero-cost/single-call blocked, sem provider ativo.

## Pontos de Entrada Para o SDR Command Center

- Rota filha em `/os/outreach/sdr-command-center`.
- Menu lateral do MOTHERXIP OS próximo ao módulo Outreach.
- Dados reaproveitados de `getProspects`, `getWebhookAuditLogs` e `getOutreachBatches`.
- Normalização local para filtros, métricas, timeline, inbox, reuniões, batches e health monitor.

## Decisão de Arquitetura

O SDR Command Center foi desenhado como complemento do Outreach Center:

- Não substitui `/os/outreach`.
- Não altera o CRM.
- Não altera Supabase.
- Não altera n8n.
- Não cria campanhas reais.
- Não envia WhatsApp.
- Não ativa OpenAI, Claude, Gemini ou Evolution API.

## Riscos Observados

- Alguns dados de timeline dependem de `outreach_events`, mas a listagem atual de prospects carrega apenas `prospect_outreach`; por isso o painel usa fallback do status atual quando eventos detalhados não estão disponíveis.
- A confirmação em lote foi mantida visual/sandbox para evitar qualquer disparo real nesta sprint.
- Human takeover foi representado localmente no painel; persistência real deve ser aprovada em sprint futura.

## Conclusão

A base existente permite integrar o SDR Command Center dentro do módulo Outreach sem duplicação estrutural. A implementação deve permanecer sandbox-only até aprovação explícita para gravação de eventos, dispatch operacional e produção.
