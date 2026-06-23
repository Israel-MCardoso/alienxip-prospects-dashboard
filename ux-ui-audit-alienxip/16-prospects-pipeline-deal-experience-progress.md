# 16 - Prospects/Pipeline Deal Experience Progress

## 1. Arquivos alterados

- `app-next/src/features/prospects/prospects-crm.tsx`
- `app-next/src/features/commercial/pipeline-board.tsx`
- `app-next/src/features/prospects/prospect-workspace.tsx`
- `tests/prospects-deal-experience.test.mjs`
- `ux-ui-audit-alienxip/16-prospects-pipeline-deal-experience-progress.md`

## 2. Melhorias em Prospects CRM

- Header visual passou a comunicar `PROSPECTS & OPORTUNIDADES`.
- Foram adicionados KPIs de lista: prospects filtrados, valor potencial, temperatura hot e SDR ativo.
- Filtros foram mantidos reativos e receberam uma moldura visual de `Filtros reativos`.
- Linhas de prospect ganharam leitura mais comercial: valor potencial, localizacao, indicacao de responsavel operacional e proxima acao.
- Acoes de linha foram enriquecidas com `Abrir`, `Editar` e `SDR`, mantendo drawers de criacao/edicao.
- A selecao em lote e envio SDR foram preservados.

## 3. Melhorias no Pipeline

- O board passou a usar o nome visual `DEAL BOARD`.
- O contador agora fala em oportunidades, nao apenas leads.
- Foram adicionados KPIs de potencial total, oportunidades hot e reunioes agendadas.
- Cards ganharam badge `Oportunidade`, localizacao e indicador de responsavel.
- Estado vazio de coluna agora orienta soltar oportunidades.
- Drag/drop HTML5, optimistic UI e `updateProspectStatusAction` foram preservados.

## 4. Aproximacao de Deals sem criar entidade

- Foi usada apenas a entidade existente `prospects`.
- O status do prospect continua sendo a etapa comercial.
- `getProspectPotentialValue` foi usado para destacar valor potencial.
- Nenhuma tabela, migration, tipo de banco ou action sensivel foi criada.

## 5. Fluxo Prospect -> Cliente/Empresa

Fluxo real encontrado e preservado:

- `convertProspectAction` continua sendo usado no Workspace do Prospect.
- A regra de conversao e payload existentes nao foram alterados.
- O formulario de conversao recebeu `CustomSelect` para status de contrato.

## 6. O que foi preservado

- Banco de dados e tipos.
- Ausencia da entidade `deals`.
- Pipeline statuses existentes.
- Drag/drop do pipeline.
- Optimistic UI e rollback.
- Drawers de criar/editar prospect.
- Acoes existentes do Prospect Workspace.
- Envio SDR em lote e limites atuais.

## 7. Riscos

- Ainda existem selects nativos em formularios de notas e no modal de ambiente SDR por causa de trechos com encoding legado; ficaram como TODO visual, sem alterar comportamento.
- O nome do responsavel aparece como indicador operacional porque a lista/pipeline nao recebem `profiles`; resolver nome completo exige ampliar data fetching.
- Os valores potenciais continuam estimativos via helper existente, nao valores de uma futura entidade `deals`.

## 8. Validacoes executadas

- `node node_modules/typescript/bin/tsc --noEmit` em `app-next`: passou.
- `npm run lint`: passou.
- `npm test`: passou, 105 testes.
- `npm run build`: passou.

Observacao: o build segue exibindo o warning antigo de Turbopack/NFT relacionado a `src/lib/ai/prompts.ts`, fora do escopo desta etapa.

## 9. Proximos passos recomendados

- Resolver encoding dos arquivos para permitir patches seguros em labels acentuadas.
- Substituir os selects nativos restantes de notas/SDR por `CustomSelect`.
- Em etapa futura, planejar entidade `deals` com migration propria, ownership/RLS e migracao cuidadosa de status atual.
- Ampliar `getProspects`/pipeline para carregar `profiles` e mostrar nome do responsavel.
