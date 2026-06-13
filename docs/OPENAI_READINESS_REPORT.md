# OpenAI Readiness Report

Data: 2026-06-12  
Status: preparado para futura ativacao, desligado por padrao  
Provider futuro principal: OpenAI  
Modelo default planejado: `gpt-4.1-mini`

## Resultado

A arquitetura pode receber OpenAI no futuro, mas a ativacao real ainda nao deve ocorrer. Nenhuma chamada foi executada, nenhuma chave foi criada, nenhum credito foi usado e nenhum provider foi conectado.

## Variaveis Planejadas

Adicionar apenas em arquivos de exemplo/documentacao enquanto o provider estiver desligado:

```env
PROVIDER_ENABLED=false
AI_DRY_RUN=true
OPENAI_API_KEY=
OPENAI_SDR_MODEL=gpt-4.1-mini
MAX_COST_PER_CONVERSATION=0
MAX_DAILY_COST=0
```

Regras:

- `OPENAI_API_KEY` deve existir somente em ambiente server-side.
- Nunca expor `OPENAI_API_KEY` no frontend.
- Nunca gravar chave real em arquivo versionado.
- Nunca usar provider real com `PROVIDER_ENABLED=false`.
- Nunca executar smoke test que chame API sem aprovacao explicita.

## Pontos de Integracao Futuros

| Ponto | Estado atual | Proxima acao futura |
| --- | --- | --- |
| Provider layer | Projetado | Implementar provider real somente em sprint separada |
| Prompt registry | Preparado em `/prompts` | Conectar com loader server-side |
| JSON schemas | Preparados | Validar saidas antes de persistir |
| Budget guard | Planejado | Implementar antes de qualquer chamada real |
| Usage logs | SQL gerado, nao aplicado | Aplicar migration somente apos aprovacao |
| n8n sandbox | Homologado | Manter como regressao |

## Guardrails Obrigatorios

Antes da primeira chamada real:

1. Confirmar chave OpenAI por fluxo seguro.
2. Definir budget maior que zero.
3. Ativar `PROVIDER_ENABLED=true` apenas no ambiente controlado.
4. Validar prompt e schema com mock provider.
5. Executar apenas 1 conversa controlada.
6. Conferir `ai_usage_logs`.
7. Conferir custo real no dashboard do provider.
8. Desligar novamente apos o teste.

## Bloqueios Atuais

- `PROVIDER_ENABLED=false`.
- `AI_DRY_RUN=true`.
- `MAX_COST_PER_CONVERSATION=0`.
- `MAX_DAILY_COST=0`.
- `OPENAI_API_KEY` nao deve ser preenchida nesta etapa.

## Confirmacao de Seguranca

- OpenAI: 0 chamadas.
- Claude: 0 chamadas.
- Gemini: 0 chamadas.
- Evolution API: 0 chamadas.
- WhatsApp real: 0 envios.
- Producao: nao ativada.
- Migration: nao aplicada.
