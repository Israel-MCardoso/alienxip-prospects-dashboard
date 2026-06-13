# Baseline - MOTHERXIP AI Brain Sandbox

Data do baseline: 2026-06-12  
Status: homologado em sandbox  
Provider atual: `MockAIProvider`  
Custo: zero

## 1. Status Atual

O AI Brain Sandbox esta homologado como baseline estavel para testes internos no MOTHERXIP.

Estado validado:

- Aba `AI Brain` disponivel no workspace do prospect.
- `MockAIProvider` ativo via `getAIProvider()`.
- 6 acoes sandbox funcionando na UI.
- Badge `AI Brain Sandbox - custo zero` exibido.
- Sem chamadas externas.
- Sem provider real.
- Sem alteracao de Supabase, n8n ou migrations na homologacao final.

## 2. Arquivos Principais

Camada AI:

- `app-next/src/lib/ai/types.ts`
- `app-next/src/lib/ai/provider.ts`
- `app-next/src/lib/ai/mock-provider.ts`
- `app-next/src/lib/ai/registry.ts`
- `app-next/src/lib/ai/schemas.ts`
- `app-next/src/lib/ai/cost-guard.ts`
- `app-next/src/lib/ai/prompts.ts`
- `app-next/src/lib/ai/index.ts`

UI sandbox:

- `app-next/src/features/ai/actions.ts`
- `app-next/src/features/ai/ai-brain-panel.tsx`
- `app-next/src/features/prospects/prospect-workspace.tsx`

Testes:

- `tests/ai-brain.test.mjs`
- `tests/ai-brain-ui.test.mjs`

Documentacao:

- `docs/AI_BRAIN_SANDBOX_UI_REPORT.md`
- `docs/AI_BRAIN_MOCK_PROVIDER_REPORT.md`
- `docs/AI_BRAIN_SANDBOX_OPERATIONAL_CHECKLIST.md`
- `docs/BASELINE_MOTHERXIP_AI_BRAIN_SANDBOX.md`

## 3. Flags de Seguranca

Flags esperadas para este baseline:

```env
PROVIDER_ENABLED=false
AI_DRY_RUN=true
OPENAI_API_KEY=
OPENAI_SDR_MODEL=gpt-4.1-mini
MAX_COST_PER_CONVERSATION=0
MAX_DAILY_COST=0
```

Regra: qualquer alteracao que permita provider real, custo maior que zero ou chamada externa esta fora deste baseline.

## 4. Provider Atual

Provider atual:

```txt
MockAIProvider
```

Resolucao esperada:

```txt
getAIProvider() -> MockAIProvider
```

Condições:

- `PROVIDER_ENABLED=false`; ou
- `AI_DRY_RUN=true`.

O `assertBudgetAllowed()` deve continuar bloqueando providers reais quando budgets estiverem zerados ou dry-run estiver ativo.

## 5. O Que Pode Ser Alterado Com Seguranca

Permitido dentro deste baseline, desde que testes passem:

- Ajustes visuais pequenos no painel sandbox.
- Melhoria de textos exibidos pela UI sandbox.
- Novos testes mockados.
- Novos cenarios deterministicos do `MockAIProvider`.
- Melhorias de validacao manual de schema.
- Atualizacao de documentacao/checklists.

Essas alteracoes continuam proibidas de chamar API externa ou persistir dados reais sem aprovacao.

## 6. O Que Nao Deve Ser Alterado Sem Aprovacao

Nao alterar sem aprovacao explicita:

- Ativar OpenAI real.
- Ativar Claude real.
- Ativar Gemini real.
- Criar ou usar `OPENAI_API_KEY` real.
- Aumentar budgets acima de zero.
- Definir `PROVIDER_ENABLED=true`.
- Definir `AI_DRY_RUN=false`.
- Aplicar `AI_USAGE_SCHEMA.sql`.
- Criar nova migration.
- Alterar Supabase produtivo.
- Alterar n8n.
- Conectar Evolution API.
- Enviar WhatsApp real.
- Transformar brief em proposta final enviada automaticamente.
- Persistir resultados do AI Brain sem desenho de auditoria e aprovacao.

## 7. Validacao Baseline

Comandos de baseline:

```bash
npm test
npm run lint
npm run build
```

Ultimo resultado registrado:

- `npm test`: `57/57`.
- `npm run lint`: passou.
- `npm run build`: passou.

## 8. Decisao

Baseline congelado:

```txt
MOTHERXIP AI Brain Sandbox V1.1
```

Esta baseline autoriza somente uso sandbox/mock/custo zero. Nao autoriza provider real, producao, Evolution API, WhatsApp real, migrations ou alteracoes em Supabase/n8n.
