# Future Integration Plan - ALIENXIP AI BRAIN

Data: 2026-06-12  
Status: plano futuro, nenhuma ativacao executada

## Objetivo

Ativar IA real somente depois que a infraestrutura estiver testada com mock provider, budget guard, schemas e logs de custo.

## Fase 0 - Estado Atual

- n8n sandbox homologado.
- MOTHERXIP UI autenticada validada.
- Supabase persistindo outreach.
- Knowledge Hub e playbooks existentes.
- Providers reais desligados.

## Fase 1 - Mock Provider

1. Criar `MockAIProvider` local.
2. Implementar `AIProvider` sem SDK externo.
3. Testar schemas JSON.
4. Testar prompts com fixtures.
5. Validar que custo permanece zero.

## Fase 2 - Budget Guard

1. Implementar leitura server-side de:
   - `PROVIDER_ENABLED`;
   - `AI_DRY_RUN`;
   - `MAX_COST_PER_CONVERSATION`;
   - `MAX_DAILY_COST`.
2. Bloquear qualquer provider real se custo maximo for zero.
3. Registrar tentativas bloqueadas em log seguro.

## Fase 3 - Migration Controlada

1. Revisar `docs/AI_USAGE_SCHEMA.sql`.
2. Aprovar aplicacao da migration.
3. Aplicar em ambiente de homologacao.
4. Atualizar types Supabase.
5. Testar inserts com mock provider.

## Fase 4 - OpenAI Dry Run Controlado

1. Configurar `OPENAI_API_KEY` por fluxo seguro.
2. Definir `OPENAI_SDR_MODEL=gpt-4.1-mini`.
3. Definir budget baixo.
4. Ativar provider apenas em ambiente controlado.
5. Executar 1 lead e 1 cenario.
6. Conferir tokens, custo, schema e logs.
7. Desativar provider.

## Fase 5 - Integracao n8n Sandbox com IA

1. Manter workflow sandbox.
2. Criar chamada ao AI Brain em modo controlado.
3. Persistir resumo e decisao.
4. Nao enviar WhatsApp real.
5. Nao conectar Evolution API.

## Fase 6 - Producao Separada

Somente apos aprovacao:

- workflow production separado;
- Evolution API homologada;
- opt-out;
- janela comercial;
- limites por dia;
- retry/backoff;
- auditoria;
- observabilidade;
- plano de rollback.

## Criterios de Go/No-Go

Go somente se:

- schemas validam;
- prompts sao aprovados;
- budget guard bloqueia corretamente;
- usage logs funcionam;
- provider pode ser desligado por env;
- humano revisa proposta final;
- campanha real continua bloqueada ate aprovacao.

No-Go se:

- qualquer chamada ocorrer com `PROVIDER_ENABLED=false`;
- custo nao for registrado;
- output sair fora do schema;
- prompt inventar preco/processo;
- rota de callback n8n ficar dependente de provider externo;
- WhatsApp real ou Evolution API forem acionados sem sprint propria.
