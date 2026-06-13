# AI Brain Mock Provider Report

Data: 2026-06-12  
Status: MockAIProvider implementado, provider real desligado  
Custo: zero

## 1. Estrutura Criada

Camada criada em:

```txt
app-next/src/lib/ai/
```

Arquivos:

- `types.ts`: contratos de entrada e saida do AI Brain.
- `provider.ts`: interface `AIProvider`.
- `mock-provider.ts`: implementacao deterministica `MockAIProvider`.
- `registry.ts`: funcao `getAIProvider()`.
- `schemas.ts`: validadores manuais para os schemas principais.
- `cost-guard.ts`: bloqueio de provider real.
- `prompts.ts`: registry estatico dos prompts.
- `index.ts`: exports publicos da camada.

Teste criado:

```txt
tests/ai-brain.test.mjs
```

## 2. Como o MockAIProvider Funciona

O `MockAIProvider` implementa todos os metodos da interface `AIProvider`:

- `analyzeLead()`
- `qualifyLead()`
- `generateReply()`
- `handleObjection()`
- `decideMeeting()`
- `generateConversationSummary()`
- `generateProposalBrief()`

As respostas sao deterministicas e baseadas em sinais locais:

- segmento;
- score de prioridade;
- presenca de website/Instagram/WhatsApp;
- notas de diagnostico;
- ultima mensagem da conversa;
- termos de intencao ou objecao.

Nenhum metodo usa SDK externo, HTTP externo, OpenAI, Claude, Gemini, Evolution API ou WhatsApp real.

## 3. Como os Prompts Sao Carregados

O arquivo `prompts.ts` registra descritores estaticos para os prompts versionados:

- `/prompts/lead-analyzer.md`
- `/prompts/sdr.md`
- `/prompts/objections.md`
- `/prompts/scheduler.md`
- `/prompts/proposal-builder.md`

Nesta sprint, a camada nao le os arquivos em runtime. Ela apenas mapeia prompt, schema e finalidade para manter o contrato pronto sem criar risco operacional.

## 4. Como os Schemas Sao Validados

O arquivo `schemas.ts` usa validacao manual simples:

- campos obrigatorios;
- strings nao vazias;
- arrays;
- booleans;
- enums principais;
- `confidence` entre 0 e 1;
- `human_review_required=true` no brief de proposta.

Validadores atuais:

- `validateLeadAnalysis()`
- `validateMeetingDecision()`
- `validateProposalBrief()`

Os JSON schemas em `/schemas/ai` continuam como fonte documental e contrato futuro.

## 5. Como o Cost Guard Impede Chamadas Reais

`assertBudgetAllowed()` bloqueia provider real quando qualquer uma destas condicoes estiver presente:

- `PROVIDER_ENABLED=false`;
- `AI_DRY_RUN=true`;
- `MAX_COST_PER_CONVERSATION=0`;
- `MAX_DAILY_COST=0`;
- custo estimado acima do limite da conversa.

`getAIProvider()` retorna `MockAIProvider` quando `PROVIDER_ENABLED` nao esta explicitamente habilitado ou quando `AI_DRY_RUN=true`.

Mesmo que exista `OPENAI_API_KEY`, esta sprint nao usa a chave e nao possui implementacao real de provider.

## 6. Como Ativar Provider Real Futuramente

Ativacao real deve ocorrer somente em sprint separada:

1. Criar provider real server-side.
2. Confirmar chave por fluxo seguro.
3. Manter `OPENAI_SDR_MODEL=gpt-4.1-mini`.
4. Definir budgets maiores que zero.
5. Aplicar migration de `ai_usage_logs` somente apos aprovacao.
6. Testar 1 conversa controlada.
7. Registrar tokens/custo.
8. Desligar novamente apos validacao.

## 7. Confirmacao de Custo Zero

- OpenAI: 0 chamadas.
- Claude: 0 chamadas.
- Gemini: 0 chamadas.
- API externa: 0 chamadas.
- Evolution API: 0 chamadas.
- WhatsApp real: 0 envios.
- `AI_USAGE_SCHEMA.sql`: nao aplicado.
- Migration real: nao criada.
- `.env.local`: nao alterado.
- Workflows n8n: nao alterados.
