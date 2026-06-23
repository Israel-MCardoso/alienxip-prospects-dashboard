# EVOLUTION API SANDBOX SETUP

Status: setup de homologacao controlada. Nao ativar producao.

## Envs Necessarias

```env
EVOLUTION_API_BASE_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=
EVOLUTION_PROVIDER_ENABLED=false
EVOLUTION_TEST_PHONE=
```

## Como Obter Base URL

Use apenas a URL do ambiente sandbox/controlado da Evolution API. Nao usar endpoint de producao sem aprovacao explicita.

## Como Informar Instance

Configure `EVOLUTION_INSTANCE_NAME` com a instance sandbox validada no painel da Evolution. A instance de producao deve ser separada da sandbox.

## Como Testar Sem Campanha

1. Configure envs de sandbox.
2. Mantenha `EVOLUTION_PROVIDER_ENABLED=false`.
3. Rode `node scripts/evolution-preflight.mjs`.
4. Confirme que nenhuma mensagem foi enviada.
5. Para teste de mensagem, use somente numero proprio/de teste em `EVOLUTION_TEST_PHONE`.
6. Execute no maximo uma mensagem por comando com `--i-approve-one-test-message`.

## Provider Desligado por Padrao

- `MockWhatsAppProvider` e o padrao.
- `EvolutionProvider.enabled=false`.
- A UI nao permite ativar producao.
- Tokens nunca devem ser impressos em logs ou relatorios.
