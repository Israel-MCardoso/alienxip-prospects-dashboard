# MOTHERXIP n8n Sandbox Integration Report

Data: 2026-06-12

## Status

- Integracao preparada em modo sandbox/controlado.
- Workflow n8n alvo: `MOTHERXIP - Outreach Sandbox V1`.
- Webhook alvo: `http://localhost:5678/webhook/motherxip-outreach-sandbox`.
- Modo SDR LLM esperado: `mock`.
- WhatsApp real: nao usado.
- Evolution API real: nao usada.
- IA paga: nao usada.
- Callback real de producao: nao usado.

## Auditoria Inicial

- `/api/outreach/dispatch`: existente. Autentica usuario, valida permissao de operador, cria/atualiza `prospect_outreach`, registra `outreach_events`, registra `prospect_activities`, cria `outreach_batches` e envia batch para n8n.
- `/api/outreach/events`: existente. Exige `x-motherxip-webhook-secret`, aceita evento unico ou lote, registra `webhook_audit_logs`, atualiza `prospect_outreach`, insere `outreach_events` e registra `prospect_activities`.
- `features/outreach`: existente com Outreach Center, filtros por ambiente, controles de pausa/parada/retomada e listagem de batches/auditoria.
- `features/prospects`: existente com CRM, selecao em lote e aba de automacao no workspace do prospect.
- Migrations de outreach encontradas no projeto: sprint 16, sprint 16.5 e sprint 18.
- Tabelas esperadas ja estavam contempladas pelo contrato local/tipos: `prospect_outreach`, `outreach_events`, `webhook_audit_logs`, `outreach_batches`.
- Migrations locais confirmadas:
  - `20260611200000_sprint_16_n8n_outreach.sql`: `prospect_outreach`, `outreach_events`.
  - `20260611210000_sprint_16_5_webhook_audit.sql`: `webhook_audit_logs`.
  - `20260611220000_sprint_18_outreach_hardening.sql`: `outreach_batches`.

## Arquivos Alterados

- `app-next/src/app/api/outreach/dispatch/route.ts`
- `app-next/src/features/outreach/actions.ts`
- `app-next/src/features/outreach/outreach-center.tsx`
- `app-next/src/features/prospects/prospects-crm.tsx`
- `app-next/src/features/prospects/prospect-workspace.tsx`
- `.env.example`
- `.env.local`
- `app-next/.env.local`
- `docs/n8n/MOTHERXIP_N8N_SANDBOX_INTEGRATION_REPORT.md`

## Variaveis Necessarias

MOTHERXIP:

```env
N8N_OUTREACH_WEBHOOK_URL=http://localhost:5678/webhook/motherxip-outreach-sandbox
MOTHERXIP_WEBHOOK_SECRET=<valor-local-seguro>
MOTHERXIP_PUBLIC_URL=http://localhost:3000
SDR_LLM_MODE=mock
```

n8n:

```env
MOTHERXIP_WEBHOOK_SECRET=<mesmo-valor-local-seguro-do-MOTHERXIP>
SDR_LLM_MODE=mock
```

O Docker Compose do n8n repassa `MOTHERXIP_WEBHOOK_SECRET` e `SDR_LLM_MODE` ao container. A validacao local confirmou `MOTHERXIP_WEBHOOK_SECRET=true`, `SDR_LLM_MODE=mock` e ausencia de chaves pagas no container.

## Payload Enviado ao n8n

```json
{
  "batch_id": "batch-...",
  "automation_source": "sandbox",
  "callback_url": "http://localhost:3000/api/outreach/events",
  "leads": [
    {
      "outreach_id": "...",
      "prospect_id": "...",
      "name": "...",
      "company_name": "...",
      "segment": "...",
      "city": "...",
      "phone": "...",
      "whatsapp": "...",
      "temperature": "...",
      "priority_score": 0
    }
  ]
}
```

## Callback Recebido do n8n

```json
{
  "prospect_id": "...",
  "event_type": "sandbox_delivered",
  "status": "delivered",
  "message": "Mensagem sandbox simulada como entregue.",
  "channel": "whatsapp",
  "n8n_execution_id": "sandbox_...",
  "metadata": {
    "batch_id": "...",
    "outreach_id": "...",
    "automation_source": "sandbox",
    "dry_run": true
  }
}
```

## Melhorias Implementadas

- `/api/outreach/dispatch` agora usa `sandbox` como default quando `automation_source` nao e enviado.
- Limite inicial do sandbox reduzido para 2 leads por lote.
- CRM de Prospects abre a confirmacao em `sandbox` por padrao.
- Modal de envio informa claramente que Sandbox nao envia WhatsApp real, nao usa IA paga e nao usa Evolution API.
- Outreach Center abre filtrado em `sandbox` por padrao.
- Acoes de retomada/inicio no sandbox foram renomeadas para `Testar SDR Sandbox`.
- Workspace do prospect ganhou acao explicita `Testar SDR Sandbox` com confirmacao antes de disparar.
- `resumeOutreachAction` foi ajustada para reenviar em sandbox por padrao.

## Evidencia do Teste Local

- Containers locais ativos: `alienxip-n8n`, `alienxip-postgres`, `alienxip-redis`, `alienxip-evolution`.
- Workflow `MOTHERXIP - Outreach Sandbox V1`: ativo no n8n, 7 nodes exportados para verificacao.
- Webhook local n8n validado com lote vazio seguro:
  - URL: `http://localhost:5678/webhook/motherxip-outreach-sandbox`
  - Resposta: `ok=true`, `mode=sandbox`, `received=0`, `accepted=0`.
  - Efeito colateral esperado: nenhum callback e nenhuma escrita no Supabase, pois `leads=[]`.
- Container n8n validado com `SDR_LLM_MODE=mock`.
- Container n8n validado sem `OPENAI_API_KEY`, sem `ANTHROPIC_API_KEY` e sem `GEMINI_API_KEY`.
- Teste ponta a ponta via UI ainda depende de sessao autenticada do MOTHERXIP e prospects elegiveis no ambiente local.
- Ressalva Docker/Windows: quando o callback e executado dentro do container n8n, `http://localhost:3000` aponta para o proprio container. Para teste ponta a ponta real com n8n em Docker e Next.js no host, pode ser necessario usar `http://host.docker.internal:3000` como URL publica interna do callback ou expor o app na mesma rede Docker. O contrato documentado permanece `http://localhost:3000` conforme solicitado.

## Validacao Tecnica

- `npm test`: falhou porque o `package.json` do `app-next` nao possui script `test`.
- `npm run lint`: aprovado.
- `npm run build`: aprovado. Next.js compilou, TypeScript passou e 30 paginas foram geradas.

## Validacao Ponta a Ponta com host.docker.internal

### Configuracao usada

- `MOTHERXIP_PUBLIC_URL=http://host.docker.internal:3000` no ambiente local.
- Callback enviado pelo n8n para `http://host.docker.internal:3000/api/outreach/events`.
- `localhost:3000` continua valido para navegador/host, mas nao para chamadas originadas dentro do container Docker do n8n.
- n8n validado com `SDR_LLM_MODE=mock`.
- n8n validado com `MOTHERXIP_WEBHOOK_SECRET` presente.
- n8n validado sem `OPENAI_API_KEY`, sem `ANTHROPIC_API_KEY` e sem `GEMINI_API_KEY`.

### Evidencias de conectividade

- Host: `POST http://localhost:3000/api/outreach/events` sem secret retornou `401`, esperado.
- Container n8n: `POST http://host.docker.internal:3000/api/outreach/events` sem secret retornou `401`, confirmando que o container alcança o Next.js no host.
- Webhook n8n: `POST http://localhost:5678/webhook/motherxip-outreach-sandbox` retornou `200`.

### Teste com 1 lead

- Quantidade testada: 1 lead.
- Prospect usado: `Orthoville Odontologia e Estética`, segmento `Dentista`, cidade `Jacareí`.
- Batch ID validado: `sandbox-e2e-hostdocker-1781246805175`.
- Entrada controlada: webhook n8n sandbox com payload real e `callback_url` via `host.docker.internal`.
- Observacao: esta execucao validou o trecho `n8n Docker -> callback MOTHERXIP local -> Supabase`. Ela nao passou pela UI autenticada `/api/outreach/dispatch`, portanto nao gerou linha em `outreach_batches`.

### Resultado n8n

```json
{
  "ok": true,
  "mode": "sandbox",
  "batch_id": "sandbox-e2e-hostdocker-1781246805175",
  "received": 1,
  "accepted": 1
}
```

### Resultado Supabase

- `prospect_outreach`: atualizado.
  - `status`: `meeting_scheduled`
  - `automation_source`: `sandbox`
  - `meeting_scheduled_at`: presente
  - `last_message_preview`: `Reuniao sandbox marcada para validacao do fluxo.`
- `outreach_events`: 7 eventos registrados para o batch.
  - `sandbox_queued`
  - `sandbox_sent`
  - `sandbox_delivered`
  - `sandbox_waiting_reply`
  - `sandbox_replied`
  - `sandbox_negotiating`
  - `sandbox_meeting_scheduled`
- `webhook_audit_logs`: 7 logs `processed`, todos com `secret_validated=true`.
- `outreach_batches`: nenhum registro neste teste direto pelo webhook n8n. A tabela continua sendo preenchida pelo fluxo `/api/outreach/dispatch`, que exige sessao autenticada.

### Correcoes feitas durante a validacao

- Removida dependencia de `upsert(... onConflict: "prospect_id")`, pois o schema atual nao possui constraint unica em `prospect_id`.
- `/api/outreach/events` agora atualiza registro existente por `id` ou insere novo registro sem exigir migration.
- `/api/outreach/dispatch` recebeu a mesma correção para funcionar com o schema atual.
- Adicionada regra anti-regressao de status: callbacks fora de ordem nao podem rebaixar `prospect_outreach.status`. Isso preservou `meeting_scheduled` mesmo com callbacks paralelos.

### UI

- A timeline da aba `Automacao` do prospect e o Outreach Center consomem `prospect_outreach`, `outreach_events` e `webhook_audit_logs`.
- Como essas tabelas foram atualizadas com sucesso, os dados de base para a UI foram persistidos.
- Confirmacao visual via UI autenticada nao foi executada nesta rodada porque o teste foi feito de forma controlada via webhook/local script, sem sessao de usuario no navegador.

### Scripts npm na raiz correta

- Raiz executada: `C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard`.
- `npm test`: aprovado, 45 testes passaram.
- `npm run lint`: aprovado.
- `npm run build`: aprovado, incluindo `build:legacy` e `build:next`.

## Validacao pela UI Autenticada

### Configuracao usada

- Usuario autenticado usado: `admin@motherxip.com`, role `owner`.
- Ambiente: sandbox local.
- `MOTHERXIP_PUBLIC_URL=http://host.docker.internal:3000`.
- Webhook de dispatch: `http://localhost:5678/webhook/motherxip-outreach-sandbox`.
- n8n em `SDR_LLM_MODE=mock`.
- Workflow `MOTHERXIP - Outreach Sandbox V1` ativo.

### Prospect e batch

- Quantidade testada: 1 lead.
- Prospect usado: `Odontoclinic - Jacarei`.
- Prospect ID: `da2dcbad-d1e9-4e10-af7a-97af8b278992`.
- Segmento: `Clinica odontologica`.
- Cidade: `Jacarei`.
- Batch criado por `/api/outreach/dispatch`: `batch-1781247821226-6254`.
- Resposta do dispatch:

```json
{
  "success": true,
  "batch_id": "batch-1781247821226-6254",
  "status": "dispatched",
  "total_requested": 1,
  "total_dispatched": 1,
  "total_skipped": 0
}
```

### Resultado Supabase

- `outreach_batches`: 1 batch novo criado.
  - `status`: `dispatched`
  - `automation_source`: `sandbox`
  - `total_requested`: `1`
  - `total_dispatched`: `1`
  - `n8n_response_status`: `200`
- `prospect_outreach`: atualizado para `meeting_scheduled`.
  - `automation_source`: `sandbox`
  - `n8n_execution_id`: presente
  - `meeting_scheduled_at`: presente
  - `last_message_preview`: `Reuniao sandbox marcada para validacao do fluxo.`
- `outreach_events`: 8 eventos vinculados ao batch.
  - 1 evento `dispatch` criado pelo MOTHERXIP.
  - 7 eventos sandbox recebidos do n8n.
- `webhook_audit_logs`: 7 logs relacionados ao batch.
  - `processed`: 7
  - `secret_validated=true`: 7
  - erros: 0

### Eventos sandbox recebidos

- `sandbox_sent`
- `sandbox_queued`
- `sandbox_waiting_reply`
- `sandbox_negotiating`
- `sandbox_meeting_scheduled`
- `sandbox_delivered`
- `sandbox_replied`

Observacao: os callbacks chegaram fora de ordem, como esperado em execucoes paralelas. A protecao anti-regressao manteve o estado final correto em `meeting_scheduled`.

### Evidencia de UI autenticada

- Workspace do prospect: `GET /os/prospects/da2dcbad-d1e9-4e10-af7a-97af8b278992` retornou `200`.
- Outreach Center: `GET /os/outreach` retornou `200`.
- HTML autenticado da workspace contem sinais da aba de automacao e reuniao.
- HTML autenticado do Outreach Center contem sinais de sandbox e reuniao.
- A UI usa os dados persistidos em `prospect_outreach`, `outreach_events`, `webhook_audit_logs` e `outreach_batches`.

### Correcoes adicionais feitas durante a validacao autenticada

- `/api/outreach/dispatch` agora valida usuario e role com o cliente autenticado e usa Admin Client apenas para persistencia operacional do lote. Isso evita falha de RLS em `prospect_outreach` sem alterar schema ou policies.
- `/api/outreach/events` reforcou a anti-regressao no proprio update do banco, usando filtro por ranking de status. Assim callbacks atrasados nao rebaixam `meeting_scheduled`.
- Leituras server-side da UI para dados operacionais de outreach usam Admin Client apos autenticacao, evitando 404 por RLS nas tabelas de automacao sem criar migration.

### Status final da validacao autenticada

- Fluxo pela UI/API autenticada: aprovado.
- `/api/outreach/dispatch`: aprovado.
- n8n recebeu batch: aprovado.
- Callback para `host.docker.internal`: aprovado.
- Supabase persistiu eventos: aprovado.
- Timeline/Workspace autenticada: respondeu `200` e renderizou dados de automacao.
- Outreach Center autenticado: respondeu `200` e renderizou dados de sandbox/reuniao.

### Testes finais apos validacao autenticada

- Raiz executada: `C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard`.
- `npm test`: aprovado, 45 testes passaram.
- `npm run lint`: aprovado.
- `npm run build`: aprovado, incluindo `build:legacy` e `build:next`.

## Confirmacoes de Seguranca

- Nenhuma IA paga foi chamada.
- Nenhum WhatsApp real foi enviado.
- Nenhuma Evolution API real foi chamada.
- Nenhum workflow de producao foi ativado.
- Secrets nao foram adicionados ao frontend.
- O ambiente padrao da integracao e sandbox.

## Proximo Passo Recomendado

Executar o MOTHERXIP local autenticado, selecionar 1 ou 2 prospects com WhatsApp valido, acionar `Testar SDR Sandbox` e validar a timeline na aba `Automacao` e o Outreach Center. Depois disso, manter a mesma arquitetura para acoplar o workflow `MOTHERXIP - SDR LLM Sandbox V1` em modo `mock`.
