# EVOLUTION API SANDBOX HOMOLOGATION REPORT

Data: 2026-06-13T05:30:33.997Z

## Preflight

Resultado: falhou

- EVOLUTION_API_BASE_URL: falhou (ausente)
- EVOLUTION_API_BASE_URL valida: falhou (ausente)
- EVOLUTION_API_KEY: falhou (ausente)
- EVOLUTION_INSTANCE_NAME: falhou (ausente)
- EVOLUTION_TEST_PHONE: falhou (ausente)
- EVOLUTION_PROVIDER_ENABLED=true: falhou (atual=undefined)
- relatorio gravavel: ok (C:\Users\israe\Desktop\Alienxip Prospects\alienxip-prospects-dashboard\docs\EVOLUTION_API_SANDBOX_HOMOLOGATION_REPORT.md)

## Health Check

Status: nao executado neste preflight.

## Test Message

Envio de mensagem: nao executado
Mensagens enviadas: 0
Telefone de teste: ****

## Rate Limit

Validacao: pendente do harness de envio aprovado.

## Opt-Out

Validacao local: preparada.

## Dead Letter

Validacao local: preparada. Migration nao aplicada.

## Seguranca

- Token exposto: nao
- Campanha real enviada: nao
- Lead real contatado: nao
- OpenAI: desligada
- Claude: desligado
- Gemini: desligado
- Production workflow: nao ativado

## Proximo Passo

Corrigir preflight antes de qualquer tentativa.

## Single Test Message

Status: bloqueado com seguranca.

### Preflight

Resultado: falhou.

Motivos:

- `EVOLUTION_API_BASE_URL` ausente.
- `EVOLUTION_API_BASE_URL` invalida/ausente.
- `EVOLUTION_API_KEY` ausente.
- `EVOLUTION_INSTANCE_NAME` ausente.
- `EVOLUTION_TEST_PHONE` ausente.
- `EVOLUTION_PROVIDER_ENABLED=true` nao configurado.

Nenhum token foi impresso. Nenhuma mensagem foi enviada no preflight.

### Health Check

Resultado: nao executado.

Motivo: o preflight falhou. Pela regra da sprint, nao foi feita consulta real da instancia Evolution.

### Resultado da Mensagem

Mensagem enviada: nao.

Quantidade exata de mensagens enviadas: 0.

Motivo: preflight bloqueado antes da etapa de health check e antes do harness `--i-approve-one-test-message`.

### Numero Mascarado

Numero de teste: ausente.

Nenhum lead real foi usado.

### Latencia

Latencia real: 0ms.

Nao houve chamada real.

### ID de Resposta Sanitizado

`provider_response_id`: nao gerado.

### Rate Limit

Resultado: nao executado para envio real porque o preflight bloqueou.

Motor local permanece validado em testes automatizados.

### Seguranca

- Campanha real enviada: nao.
- Lead real contatado: nao.
- Mensagem WhatsApp enviada: nao.
- OpenAI: nao chamada.
- Claude: nao chamado.
- Gemini: nao chamado.
- SDR IA real: nao usado.
- Retry automatico: nao executado.
- Token exposto: nao.
- Secret registrado em relatorio: nao.

### Proximo Passo

Configurar as envs apenas em ambiente local seguro e repetir somente o preflight:

```bash
node scripts/evolution-preflight.mjs
```

Se o preflight passar, executar health check real. Enviar a mensagem unica somente se a instancia estiver conectada e houver aprovacao explicita com `--i-approve-one-test-message`.
