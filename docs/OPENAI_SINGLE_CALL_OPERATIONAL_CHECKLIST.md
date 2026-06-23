# OPENAI SINGLE CALL OPERATIONAL CHECKLIST

Status: checklist para tentativa futura. Nao executar sem aprovacao explicita.

## Antes de Qualquer Chamada

- [ ] Confirmar que a tentativa foi aprovada explicitamente.
- [ ] Validar o preco oficial atual de `gpt-4.1-mini`.
- [ ] Registrar input price em USD por 1M tokens.
- [ ] Registrar output price em USD por 1M tokens.
- [ ] Registrar data da validacao.
- [ ] Registrar fonte oficial usada.
- [ ] Bloquear a tentativa se o preco nao estiver claro.

## Configurar Envs

- [ ] `PROVIDER_ENABLED=true`.
- [ ] `AI_DRY_RUN=false`.
- [ ] `OPENAI_API_KEY` presente no ambiente seguro.
- [ ] Confirmar que a chave nao sera impressa em terminal, logs ou relatorio.
- [ ] `OPENAI_SDR_MODEL=gpt-4.1-mini`.
- [ ] `MAX_COST_PER_CONVERSATION` maior que zero.
- [ ] `MAX_DAILY_COST` maior que zero.
- [ ] `OPENAI_GPT41_MINI_INPUT_USD_PER_1M` preenchido.
- [ ] `OPENAI_GPT41_MINI_OUTPUT_USD_PER_1M` preenchido.
- [ ] `OPENAI_PRICE_SOURCE_URL` preenchido com fonte oficial.
- [ ] `OPENAI_PRICE_VALIDATED_AT` preenchido.

## Rodar Preflight

- [ ] Executar `node scripts/test-openai-single-call.mjs --preflight`.
- [ ] Confirmar que o preflight passou.
- [ ] Confirmar que nenhuma chamada OpenAI foi feita no preflight.
- [ ] Confirmar que prompts foram carregados.
- [ ] Confirmar que schema foi carregado.
- [ ] Confirmar que o relatorio e gravavel.
- [ ] Confirmar budgets antes da chamada.

## Aprovar Uma Chamada

- [ ] Confirmar que sera feita no maximo 1 chamada.
- [ ] Confirmar que nao havera retry automatico.
- [ ] Confirmar que nao havera WhatsApp real.
- [ ] Confirmar que nao havera Evolution API.
- [ ] Confirmar que nao havera callback real.
- [ ] Confirmar que nao havera Supabase.
- [ ] Confirmar que nao havera n8n.

## Executar Harness

- [ ] Executar `node scripts/test-openai-single-call.mjs --i-approve-one-openai-call`.
- [ ] Verificar que o modelo usado foi `gpt-4.1-mini`.
- [ ] Registrar tokens de entrada.
- [ ] Registrar tokens de saida.
- [ ] Registrar custo estimado.
- [ ] Registrar resposta bruta sanitizada.
- [ ] Registrar resposta parseada.
- [ ] Validar schema.
- [ ] Validar tom consultivo em portugues.
- [ ] Validar ausencia de promessa garantida ou pressao agressiva.
- [ ] Nao repetir automaticamente em caso de erro.

## Depois da Execucao

- [ ] Atualizar `docs/OPENAI_SINGLE_CALL_SANDBOX_REPORT.md`.
- [ ] Rodar `npm test`.
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run build`.
- [ ] Registrar recomendacao: aprovado para 5 chamadas, ajustar prompt ou bloquear provider real.
