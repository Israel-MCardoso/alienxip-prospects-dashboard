# AI Brain Sandbox Operational Checklist

Objetivo: repetir a homologacao da aba `AI Brain` em modo sandbox/custo zero, sem provider real, sem chamadas externas e sem alteracoes estruturais.

## 1. Preparar ambiente

- [ ] Confirmar que a branch/workspace correto esta aberto.
- [ ] Confirmar que `.env.local` nao sera alterado para ativar provider real.
- [ ] Confirmar `PROVIDER_ENABLED=false`.
- [ ] Confirmar `AI_DRY_RUN=true`.
- [ ] Confirmar `MAX_COST_PER_CONVERSATION=0`.
- [ ] Confirmar `MAX_DAILY_COST=0`.
- [ ] Confirmar que nenhuma migration sera aplicada.
- [ ] Confirmar que n8n nao sera alterado.

## 2. Subir dev server

- [ ] Rodar `npm run dev` na raiz `alienxip-prospects-dashboard`.
- [ ] Confirmar que `http://localhost:3000` responde.
- [ ] Confirmar que nao ha overlay de erro do Next.js na primeira tela.

## 3. Login

- [ ] Abrir `http://localhost:3000/os/login`.
- [ ] Logar no MOTHERXIP com usuario autorizado.
- [ ] Confirmar acesso ao workspace protegido.

## 4. Abrir prospect

- [ ] Abrir um prospect real do CRM.
- [ ] Preferencialmente usar `Odontoclinic - Jacarei` para regressao comparavel.
- [ ] Confirmar que o workspace do prospect carregou.
- [ ] Confirmar que nao ha erro visual bloqueante.

## 5. Abrir aba AI Brain

- [ ] Clicar na aba `AI Brain`.
- [ ] Confirmar que o painel `AI Brain Sandbox` renderizou.
- [ ] Confirmar badge `AI Brain Sandbox - custo zero`.
- [ ] Confirmar aviso `Modo simulado. Nenhuma API externa sera chamada.`
- [ ] Confirmar indicador `Provider mock`.

## 6. Testar as 6 acoes

- [ ] Clicar em `Analisar Lead`.
- [ ] Confirmar resultado com nivel digital, dores/oportunidades e recomendacao.
- [ ] Clicar em `Qualificar Lead`.
- [ ] Confirmar temperatura, prioridade, ICP provavel, sinais e recomendacao.
- [ ] Preencher `Mensagem recebida do lead`.
- [ ] Clicar em `Gerar Resposta SDR`.
- [ ] Confirmar resposta sugerida, intent, stage, confidence e next action.
- [ ] Preencher `Objecao do lead`.
- [ ] Clicar em `Tratar Objecao`.
- [ ] Confirmar resposta consultiva, estrategia e proximos passos.
- [ ] Clicar em `Decidir Reuniao`.
- [ ] Confirmar decisao, motivo, confidence e proxima acao.
- [ ] Clicar em `Brief de Proposta`.
- [ ] Confirmar diagnostico resumido, missao recomendada, escopo, beneficio esperado e proximo passo.

## 7. Validar console e rede

- [ ] Abrir console do navegador.
- [ ] Confirmar zero erros JavaScript bloqueantes.
- [ ] Confirmar que nao houve chamada externa para OpenAI, Claude ou Gemini.
- [ ] Confirmar que nao houve Evolution API.
- [ ] Confirmar que nao houve envio de WhatsApp real.

## 8. Rodar validacoes tecnicas

- [ ] Rodar `npm test`.
- [ ] Confirmar todos os testes passando.
- [ ] Rodar `npm run lint`.
- [ ] Confirmar lint sem erros.
- [ ] Rodar `npm run build`.
- [ ] Confirmar build completo passando.

## 9. Criterios de aprovacao

- [ ] Aba AI Brain abriu autenticada.
- [ ] As 6 acoes funcionaram.
- [ ] Badge sandbox/custo zero visivel.
- [ ] Provider exibido como mock.
- [ ] Console sem erro bloqueante.
- [ ] OpenAI: 0 chamadas.
- [ ] Claude: 0 chamadas.
- [ ] Gemini: 0 chamadas.
- [ ] Evolution API: 0 chamadas.
- [ ] WhatsApp real: 0 envios.
- [ ] Supabase sem alteracao estrutural.
- [ ] n8n sem alteracao.
- [ ] Migrations nao aplicadas.
- [ ] `npm test`, `npm run lint` e `npm run build` passaram.

## 10. Encerramento

- [ ] Registrar prospect testado.
- [ ] Registrar resultado visual.
- [ ] Registrar resultado dos comandos.
- [ ] Atualizar relatorio somente com evidencias.
- [ ] Nao avancar para provider real sem aprovacao separada.
