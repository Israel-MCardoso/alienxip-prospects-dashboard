# OPENAI SINGLE CALL SANDBOX REPORT

Data: 2026-06-13T00:14:50.585Z

## Preflight

Resultado: falhou

- PROVIDER_ENABLED=true: falhou (atual=undefined)
- AI_DRY_RUN=false: falhou (atual=undefined)
- OPENAI_API_KEY: falhou (ausente)
- OPENAI_SDR_MODEL=gpt-4.1-mini: ok (atual=gpt-4.1-mini)
- MAX_COST_PER_CONVERSATION > 0: falhou (atual=undefined)
- MAX_DAILY_COST > 0: falhou (atual=undefined)
- relatorio gravavel: ok (C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard\docs\OPENAI_SINGLE_CALL_SANDBOX_REPORT.md)
- prompts carregados: ok (C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard\prompts\sdr.md)
- schema carregado: ok (C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard\schemas\ai\ConversationState.schema.json)

## Validacao de Preco Oficial

Input price: nao validado USD / 1M tokens
Output price: nao validado USD / 1M tokens
Data da validacao: 2026-06-13
Fonte usada: https://openai.com/api/pricing/ e https://developers.openai.com/api/docs/pricing
Status: nao claro

Observacao: a fonte oficial consultada lista `gpt-4.1-mini` no seletor/calculadora, mas a tabela textual de precos acessada nesta validacao nao apresentou valores claros de input e output para `gpt-4.1-mini`. Pela regra da sprint, nenhuma chamada real foi executada.

## Execucao

Chamada foi executada: nao
Chamadas OpenAI executadas: 0
Modelo usado: gpt-4.1-mini
Tokens de entrada: 0
Tokens de saida: 0
Custo estimado: 0

## Resposta Bruta Sanitizada

```json
{}
```

## Resposta Parseada

```json
null
```

## Validacao de Schema

Valida: nao
Erros: PROVIDER_ENABLED=true; AI_DRY_RUN=false; OPENAI_API_KEY; MAX_COST_PER_CONVERSATION > 0; MAX_DAILY_COST > 0

## Fallback

Fallback usado: nao

## Seguranca

- WhatsApp real: nao
- Evolution API: nao
- Callback real: nao
- Supabase alterado: nao
- n8n alterado: nao
- API key exposta: nao

## Recomendacao

bloquear provider real

## Status Final da Sprint 20

Status: preparada, bloqueada com seguranca e sem chamada real.

### O que foi criado

- `scripts/test-openai-single-call.mjs`: harness operacional com `--preflight` e `--i-approve-one-openai-call`.
- `tests/openai-single-call-harness.test.mjs`: cobertura do harness, travas, sanitizacao e relatorio.
- `docs/OPENAI_SINGLE_CALL_SANDBOX_REPORT.md`: evidencia operacional da tentativa bloqueada.
- Ajuste em `package.json`: `npm test` passa a executar `tests/*.mjs`, evitando que o harness CLI seja coletado como teste.

### Por que a chamada foi bloqueada

A chamada real foi bloqueada porque o ambiente atual nao cumpriu as condicoes minimas de homologacao:

- `PROVIDER_ENABLED=true` nao estava liberado.
- `AI_DRY_RUN=false` nao estava liberado.
- `OPENAI_API_KEY` estava ausente.
- `MAX_COST_PER_CONVERSATION` nao estava positivo.
- `MAX_DAILY_COST` nao estava positivo.
- O preco oficial de `gpt-4.1-mini` nao ficou claro na captura textual consultada.

### Travas que funcionaram

- Preflight obrigatorio antes de chamada real.
- Flag explicita `--i-approve-one-openai-call` exigida para qualquer chamada.
- Bloqueio por ausencia de API key, sem imprimir segredo.
- Bloqueio por budgets ausentes ou zerados.
- Bloqueio por preco oficial nao validado.
- Sem retry automatico pago.
- Relatorio sanitizado.

### Confirmacao de chamadas

- Chamadas OpenAI executadas: 0.
- Claude: 0.
- Gemini: 0.
- WhatsApp real: nao.
- Evolution API: nao.
- Callback real: nao.
- Supabase: sem alteracao.
- n8n: sem alteracao.
- API key exposta: nao.

### Resultado das validacoes

- `npm test`: passou, 73/73.
- `npm run lint`: passou.
- `npm run build`: passou.

### Limitacoes atuais

- A homologacao de resposta real ainda nao ocorreu.
- Nao ha tokens reais de entrada/saida.
- Nao ha custo real registrado.
- O preco oficial precisa estar claro antes de qualquer tentativa.
- O harness possui caminho de chamada real, mas permanece bloqueado pelas travas e exige aprovacao explicita.

### Requisitos para tentativa futura

- Validar preco oficial atual de `gpt-4.1-mini` com input/output claros.
- Configurar `PROVIDER_ENABLED=true`.
- Configurar `AI_DRY_RUN=false`.
- Configurar `OPENAI_API_KEY` sem expor a chave.
- Configurar `OPENAI_SDR_MODEL=gpt-4.1-mini`.
- Configurar `MAX_COST_PER_CONVERSATION` maior que zero.
- Configurar `MAX_DAILY_COST` maior que zero.
- Rodar `node scripts/test-openai-single-call.mjs --preflight`.
- Executar somente uma chamada com `--i-approve-one-openai-call`.
- Nao repetir automaticamente em caso de erro.
