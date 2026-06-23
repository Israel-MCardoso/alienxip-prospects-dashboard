# OPENAI PROVIDER READINESS REPORT

Status: preparado em modo zero cost.

Data: 2026-06-12

## Resumo

A Sprint 19 criou a infraestrutura inicial do adapter OpenAI para uso futuro com `gpt-4.1-mini`, sem ativar provider real e sem realizar chamadas externas.

O comportamento seguro permanece como regra:

- `PROVIDER_ENABLED=false` mantem `MockAIProvider`.
- `AI_DRY_RUN=true` mantem `MockAIProvider`.
- `MAX_COST_PER_CONVERSATION=0` bloqueia provider real.
- `MAX_DAILY_COST=0` bloqueia provider real.
- `OPENAI_API_KEY` ausente bloqueia provider real.

Mesmo com a classe `OpenAIProvider` criada, ela esta estrutural e desativada: `enabled=false`, sem SDK, sem HTTP, sem consumo de credito e com fallback mock-shaped.

## Arquivos Criados

- `app-next/src/lib/ai/openai-provider.ts`
- `app-next/src/lib/ai/cost-engine.ts`
- `app-next/src/lib/ai/usage-tracker.ts`
- `tests/openai-provider.test.mjs`
- `docs/OPENAI_PROVIDER_READINESS_REPORT.md`

## Arquivos Modificados

- `app-next/src/lib/ai/provider.ts`
- `app-next/src/lib/ai/registry.ts`
- `app-next/src/lib/ai/mock-provider.ts`
- `app-next/src/lib/ai/prompts.ts`
- `app-next/src/lib/ai/schemas.ts`
- `app-next/src/lib/ai/cost-guard.ts`
- `app-next/src/lib/ai/index.ts`
- `tests/ai-brain.test.mjs`

## Fluxo de Execucao

1. A UI ou server action chama `getAIProvider()`.
2. A factory avalia `PROVIDER_ENABLED`, `AI_DRY_RUN`, `OPENAI_API_KEY` e budget guard.
3. Se qualquer regra bloquear uso real, retorna `MockAIProvider`.
4. Somente com todas as condicoes abertas a factory instancia `OpenAIProvider`.
5. O `OpenAIProvider` atual carrega prompts do registry, estima uso localmente, valida schema e retorna fallback seguro baseado no mock.

## Prompt Registry

O adapter usa carregamento centralizado dos prompts existentes:

- `prompts/lead-analyzer.md`
- `prompts/sdr.md`
- `prompts/objections.md`
- `prompts/scheduler.md`
- `prompts/proposal-builder.md`

Nao ha prompt hardcoded no provider.

## Schema Enforcement

Foram conectadas validacoes para:

- `LeadAnalysis`
- `LeadQualification`
- `GenerateReply` / `ConversationState`
- `HandleObjection`
- `MeetingDecision`
- `ConversationSummary`
- `ProposalBrief`

Em falha de schema, `ensureAIResult()` registra erro e retorna fallback seguro.

## Usage Tracking

`usage-tracker.ts` registra em memoria:

- `timestamp`
- `provider`
- `model`
- `feature`
- `estimated_input_tokens`
- `estimated_output_tokens`
- `estimated_cost`
- `conversation_id`

Nao ha escrita em banco nesta sprint.

## Cost Engine

`cost-engine.ts` centraliza a configuracao de preco estimado para `gpt-4.1-mini` e calcula custo por tokens de entrada e saida.

Observacao: os valores devem ser reconfirmados na documentacao oficial da OpenAI antes de qualquer ativacao real.

## Evidencia de Custo Zero

- Nenhum SDK OpenAI foi importado.
- Nenhum `fetch` foi adicionado na camada AI.
- Nenhum client HTTP externo foi adicionado.
- Nenhuma API key foi exigida.
- Nenhuma chamada externa foi executada.
- `OpenAIProvider.enabled=false`.
- Com as flags seguras atuais, `getAIProvider()` retorna `MockAIProvider`.

## Riscos

- O adapter ainda nao contem chamada real para OpenAI por decisao de seguranca.
- Os custos sao estimativas preparatorias e devem ser revisados antes de producao.
- A persistencia de usage logs ainda nao grava em `ai_usage_logs`.
- A ativacao futura deve passar por nova homologacao autenticada e monitoramento de custo.

## Checklist de Ativacao Futura

- Confirmar preco oficial atual do modelo.
- Definir `OPENAI_API_KEY` em ambiente seguro.
- Definir `OPENAI_SDR_MODEL=gpt-4.1-mini`.
- Alterar `PROVIDER_ENABLED=true`.
- Alterar `AI_DRY_RUN=false`.
- Configurar `MAX_COST_PER_CONVERSATION` maior que zero.
- Configurar `MAX_DAILY_COST` maior que zero.
- Implementar chamada real com schema response estrito.
- Persistir usage logs em banco somente apos migration aprovada.
- Rodar `npm test`, `npm run lint` e `npm run build`.
- Homologar em sandbox antes de qualquer producao.

## Validacoes

- `npm test`: passou, 67/67.
- `npm run lint`: passou.
- `npm run build`: passou.

Observacao de build: o Turbopack emitiu um aviso nao bloqueante sobre tracing de filesystem por causa do carregamento local dos prompts Markdown. Nao houve erro de compilacao, tipagem ou geracao de paginas.

## Varredura de Chamadas Externas

Resultado das buscas na camada `app-next/src/lib/ai`:

- `fetch(`: nao encontrado.
- `new OpenAI(`: nao encontrado.
- `from "openai"`: nao encontrado.
- `axios`: nao encontrado na camada AI.

O unico registro de `axios` observado esta dentro da regex de teste que impede uso de clients HTTP externos.
