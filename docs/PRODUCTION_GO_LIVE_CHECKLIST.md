# PRODUCTION GO LIVE CHECKLIST

Status: checklist futuro. Nao executar sem aprovacao explicita.

## Antes da Ativacao

- [ ] Aprovar formalmente go-live.
- [ ] Confirmar workflow n8n Production separado do Sandbox.
- [ ] Confirmar credenciais Production separadas.
- [ ] Confirmar instance Evolution Production separada.
- [ ] Confirmar que Sandbox continua isolado.
- [ ] Aplicar migration `outreach_dead_letters` somente apos aprovacao.
- [ ] Validar RLS, auditoria e acesso administrativo.

## Evolution API

- [ ] Configurar URL.
- [ ] Configurar Instance.
- [ ] Configurar API key em segredo seguro.
- [ ] Validar heartbeat.
- [ ] Validar latencia.
- [ ] Validar status conectado/desconectado.
- [ ] Fazer teste controlado sem campanha.

## Rate Limit

- [ ] Definir mensagens por hora.
- [ ] Definir mensagens por dia.
- [ ] Definir delay minimo.
- [ ] Definir delay maximo.
- [ ] Confirmar janela comercial 08:00 as 18:00.
- [ ] Confirmar timezone.
- [ ] Confirmar que fora da janela entra em fila.

## Retry e Dead Letter

- [ ] Confirmar 3 tentativas para callback.
- [ ] Confirmar 3 tentativas para Evolution.
- [ ] Confirmar 3 tentativas para webhook.
- [ ] Confirmar backoff 30s, 60s, 120s.
- [ ] Confirmar dead letter apos tentativas excedidas.
- [ ] Confirmar painel de falhas.

## Opt-Out

- [ ] Validar frases de opt-out.
- [ ] Confirmar status `opt_out`.
- [ ] Confirmar bloqueio de novos envios.
- [ ] Confirmar evento registrado.
- [ ] Confirmar auditoria registrada.

## IA e Custos

- [ ] Manter OpenAI desligada ate sprint especifica.
- [ ] Confirmar `PROVIDER_ENABLED=false` antes do go-live sem IA.
- [ ] Confirmar `AI_DRY_RUN=true` antes do go-live sem IA.
- [ ] Confirmar budget zero quando IA estiver desligada.
- [ ] Nao ativar Claude ou Gemini.

## Monitoramento

- [ ] Validar Outreach Center Production.
- [ ] Validar fila.
- [ ] Validar falhas.
- [ ] Validar retries.
- [ ] Validar dead letters.
- [ ] Validar opt-outs.
- [ ] Validar conversas ativas, pausadas e aguardando resposta.
- [ ] Validar reunioes marcadas.

## Execucao

- [ ] Rodar `npm test`.
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run build`.
- [ ] Fazer teste visual autenticado.
- [ ] Executar somente lote piloto aprovado.
- [ ] Monitorar eventos e auditoria.
- [ ] Parar imediatamente em caso de anomalia.
