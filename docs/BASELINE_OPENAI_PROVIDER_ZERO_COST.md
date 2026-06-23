# BASELINE OPENAI PROVIDER ZERO COST

Status: baseline seguro apos Sprint 20.

## Estado Atual

- OpenAIProvider existe como infraestrutura preparatoria.
- MockAIProvider continua sendo o provider seguro padrao.
- Sprint 20 ficou preparada e bloqueada com seguranca.
- Nenhuma chamada real OpenAI foi executada.
- Nenhum SDK OpenAI foi adicionado.
- Nenhuma API key foi exposta.
- Nenhuma alteracao foi feita em Supabase, n8n, Evolution API ou WhatsApp.

## Arquivos Principais

- `app-next/src/lib/ai/provider.ts`
- `app-next/src/lib/ai/openai-provider.ts`
- `app-next/src/lib/ai/mock-provider.ts`
- `app-next/src/lib/ai/cost-guard.ts`
- `app-next/src/lib/ai/cost-engine.ts`
- `app-next/src/lib/ai/usage-tracker.ts`
- `app-next/src/lib/ai/prompts.ts`
- `app-next/src/lib/ai/schemas.ts`
- `scripts/test-openai-single-call.mjs`
- `tests/openai-provider.test.mjs`
- `tests/openai-single-call-harness.test.mjs`
- `docs/OPENAI_PROVIDER_READINESS_REPORT.md`
- `docs/OPENAI_SINGLE_CALL_SANDBOX_REPORT.md`
- `docs/OPENAI_SINGLE_CALL_OPERATIONAL_CHECKLIST.md`

## Flags de Seguranca

Baseline seguro:

- `PROVIDER_ENABLED=false`
- `AI_DRY_RUN=true`
- `MAX_COST_PER_CONVERSATION=0`
- `MAX_DAILY_COST=0`
- `OPENAI_API_KEY` ausente ou nao configurada

## Condicoes que Bloqueiam Provider Real

O provider real deve permanecer bloqueado se qualquer condicao abaixo ocorrer:

- `PROVIDER_ENABLED` diferente de `true`.
- `AI_DRY_RUN` diferente de `false`.
- `OPENAI_API_KEY` ausente.
- `OPENAI_SDR_MODEL` diferente de `gpt-4.1-mini` para a homologacao single-call.
- `MAX_COST_PER_CONVERSATION` ausente, invalido ou menor/igual a zero.
- `MAX_DAILY_COST` ausente, invalido ou menor/igual a zero.
- Preco oficial de `gpt-4.1-mini` nao validado com input/output claros.
- Tentativa sem `--i-approve-one-openai-call`.
- Qualquer erro de preflight.

## Condicoes Necessarias para Provider Real

Para uma tentativa futura controlada:

- Aprovacao explicita da tentativa.
- Preco oficial atual validado e registrado.
- `PROVIDER_ENABLED=true`.
- `AI_DRY_RUN=false`.
- `OPENAI_API_KEY` presente em ambiente seguro.
- `OPENAI_SDR_MODEL=gpt-4.1-mini`.
- `MAX_COST_PER_CONVERSATION` maior que zero.
- `MAX_DAILY_COST` maior que zero.
- Preflight aprovado.
- Execucao limitada a uma chamada.
- Sem retry automatico.
- Logging sanitizado.

## O Que Pode Ser Alterado com Seguranca

- Documentacao operacional.
- Testes de harness sem chamada externa.
- Mensagens de erro e relatorio sanitizado.
- Checklist de ativacao futura.
- Validacoes locais de schema e prompt.

## O Que Nao Deve Ser Alterado Sem Aprovacao

- Ativar `PROVIDER_ENABLED=true`.
- Alterar `AI_DRY_RUN=false` em ambiente compartilhado.
- Inserir ou expor `OPENAI_API_KEY`.
- Adicionar SDK OpenAI.
- Adicionar chamadas externas fora do harness aprovado.
- Executar mais de uma chamada OpenAI.
- Criar retry automatico.
- Alterar Supabase.
- Criar migrations.
- Alterar n8n.
- Conectar Evolution API.
- Enviar WhatsApp real.
- Ativar producao.
