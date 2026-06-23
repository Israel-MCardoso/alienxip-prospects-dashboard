# SDR Command Center Report

Data: 2026-06-13

## Resumo

A Sprint 24 criou o SDR Command Center como uma rota filha do módulo Outreach, integrada aos dados existentes do MOTHERXIP. A entrega permanece em modo sandbox, com produção bloqueada e sem chamadas externas.

## Arquitetura

Nova rota:

- `/os/outreach/sdr-command-center`

Camada visual:

- `app-next/src/features/outreach/sdr-command-center.tsx`

Camada de normalização testável:

- `app-next/src/features/outreach/sdr-command-center-utils.ts`

Dados reaproveitados:

- `getProspects()`
- `getWebhookAuditLogs()`
- `getOutreachBatches()`

Menu:

- `app-next/src/components/layout/os-shell.tsx`

## Componentes e Estruturas Reutilizadas

- Cards, badges, botões e inputs do design system local.
- Tipos de `ProspectRow`, `OutreachBatchRow` e `WebhookAuditLogRow`.
- Módulo `features/outreach` existente.
- Rotas autenticadas sob `app-next/src/app/os/(protected)/outreach`.
- Tabelas já existentes: `prospects`, `prospect_outreach`, `outreach_events`, `outreach_batches`, `webhook_audit_logs`.

## Funcionalidades Entregues

- Dashboard operacional com:
  - Leads elegíveis
  - Em automação
  - Conversas ativas
  - Aguardando resposta
  - Negociações
  - Reuniões marcadas
  - Opt-Out
  - Falhas
  - Lotes ativos
- Filtros por:
  - cidade
  - segmento
  - temperatura
  - CRM status
  - status da automação
  - reunião marcada
  - opt-out
  - telefone válido
  - aguardando resposta
  - falha
- Seleção em lote com botão `Enviar para Automação SDR`.
- Confirmação sandbox local, sem dispatch real nesta sprint.
- Aba de conversas em formato inbox comercial.
- Timeline cronológica por prospect com fallback para status atual.
- Botão `Assumir Conversa` com evento local `human_takeover`.
- Painel `Reuniões Detectadas` com ações sandbox `Aprovar` e `Rejeitar`.
- Aba `Lotes` integrada a `outreach_batches`.
- Aba `Health Monitor` com stuck 24/48/72h, dead letters e falhas recentes.
- Badge explícito `Sandbox somente`.
- Sinalização explícita `Production bloqueada`.

## Arquivos Criados

- `app-next/src/features/outreach/sdr-command-center.tsx`
- `app-next/src/features/outreach/sdr-command-center-utils.ts`
- `app-next/src/app/os/(protected)/outreach/sdr-command-center/page.tsx`
- `tests/sdr-command-center.test.mjs`
- `docs/SDR_COMMAND_CENTER_AUDIT.md`
- `docs/SDR_COMMAND_CENTER_REPORT.md`

## Arquivos Modificados

- `app-next/src/components/layout/os-shell.tsx`

## Segurança

Confirmações da sprint:

- OpenAI não foi ativada.
- Claude não foi ativado.
- Gemini não foi ativado.
- Evolution API não foi ativada.
- WhatsApp real não foi enviado.
- Produção permanece bloqueada.
- Nenhuma migration foi criada.
- Supabase não foi alterado.
- n8n não foi alterado.
- Nenhuma campanha real foi criada.
- Os novos arquivos não fazem `fetch` externo nem importam provider real.

## Limitações Atuais

- O dispatch em lote está limitado à confirmação sandbox local.
- O evento `human_takeover` é representado no estado local da UI e não persiste no banco.
- Aprovar/Rejeitar reunião está visual/sandbox, sem gravação.
- Timeline detalhada depende de eventos carregados; quando a listagem não traz `outreach_events`, o painel mostra fallback do status atual.

## Testes

Teste criado:

- `tests/sdr-command-center.test.mjs`

Cobertura:

- filtros
- elegibilidade
- métricas
- timeline
- inbox
- batches
- human takeover
- reuniões
- bloqueio de produção
- ausência de chamadas externas nos novos arquivos

## Validações Finais

- `npm test`: passou, 95/95.
- `npm run lint`: passou, sem erros.
- `npm run build`: passou.
- Observação: o build manteve o warning já conhecido do Turbopack/NFT relacionado a `app-next/src/lib/ai/prompts.ts`; não bloqueou a compilação nem foi introduzido pelo SDR Command Center.

## Próximos Passos Recomendados

1. Homologar visualmente a rota `/os/outreach/sdr-command-center` com usuário autenticado.
2. Em sprint futura, aprovar persistência sandbox de `human_takeover`.
3. Em sprint futura, conectar o botão de seleção em lote ao dispatch sandbox com confirmação dupla.
4. Só considerar produção após checklist formal de Evolution API, opt-out, rate limit, logs e aprovação humana.
