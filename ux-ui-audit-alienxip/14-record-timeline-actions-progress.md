# Record Timeline + Actions Progress - MOTHERXIP OS

Data: 2026-06-22

## Arquivos alterados

- `app-next/src/components/records/RecordTimeline.tsx`
- `app-next/src/features/operations/data.ts`
- `app-next/src/features/prospects/prospect-workspace.tsx`
- `app-next/src/app/os/(protected)/clients/[id]/page.tsx`
- `app-next/src/app/os/(protected)/companies/[id]/page.tsx`
- `ux-ui-audit-alienxip/14-record-timeline-actions-progress.md`

## Timelines implementadas

- Prospect:
  - Timeline operacional central usando `RecordTimeline`.
  - Consolida prospect criado, diagnostico, notas, atividades, tarefas, propostas e eventos de outreach.
  - Mantem tabs e formularios existentes acessiveis abaixo da timeline.

- Cliente:
  - Timeline operacional baseada nos dados ja carregados ou seguros de buscar.
  - Consolida cliente criado, contrato atual, projetos, tarefas e arquivos.

- Empresa:
  - Timeline operacional baseada em empresa criada, observacoes, clientes vinculados, projetos e tarefas.

## Acoes rapidas ativadas

- Criar tarefa para Cliente:
  - Ativada via `createGeneralTaskAction`.
  - Usa hidden inputs `client_id` e `company_id`.
  - Usa `CustomSelect` para prioridade e responsavel.

- Criar tarefa para Empresa:
  - Ativada via `createGeneralTaskAction`.
  - Usa hidden input `company_id`.
  - Usa `CustomSelect` para prioridade e responsavel.

- Busca de tarefas por Empresa:
  - `getTasks` agora aceita filtro opcional `company_id`, usando coluna ja existente em `commercial_tasks`.

## Acoes mantidas como placeholder

- Criar cliente direto pela tela de Empresa.
  - Mantido desabilitado porque nao ha Server Action especifica e segura para criar cliente vinculado a empresa sem novo fluxo/regra.

## Dados reutilizados

- Prospect:
  - `prospect`, `diagnostic`, `notes`, `activities`, `tasks`, `proposals`, `outreachEvents`.

- Cliente:
  - `client`, `projectsResult`, `files`, `tasksResult`, `refs`, `playbooks`.

- Empresa:
  - `company`, `clientsResult`, `projectsResult`, `tasksResult`, `refs`.

## O que nao foi alterado

- Nenhuma migracao de banco.
- Nenhuma entidade `deals`.
- Nenhum pacote instalado.
- Nenhuma regra de negocio sensivel alterada.
- Server Actions existentes foram reaproveitadas.
- Formularios de edicao, arquivar/restaurar cliente e criacao de projeto foram preservados.

## Riscos identificados

- `createGeneralTaskAction` ja suporta `client_id` e `company_id`, mas sua revalidacao original foca tarefas/calendario/activity/dashboard e projeto quando existe. As rotas de Cliente/Empresa continuam dinamicas, mas uma revalidacao especifica dessas paginas pode ser avaliada em etapa futura.
- A timeline de Cliente/Empresa ainda e operacional, nao historico auditavel completo, porque as paginas nao carregam feed global de atividades por entidade.
- O build mantem warning nao bloqueante antigo do Turbopack/NFT relacionado a `src/lib/ai/prompts.ts`.

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.
  - Observacao: warning nao bloqueante antigo de NFT/Turbopack em AI prompts.
- `npm test`: passou, 98/98 testes.
- `node node_modules/typescript/bin/tsc --noEmit`: passou.

## Proximos passos recomendados

- Criar fluxo seguro de criacao de Cliente a partir de Empresa.
- Adicionar feed real de atividades globais filtrado por `client_id` e `company_id`, se o modelo de dados atual permitir sem migracao.
- Revisar `TaskForm` global em etapa futura para substituir selects nativos por `CustomSelect`.
- Avaliar revalidacao especifica de `/os/clients/[id]` e `/os/companies/[id]` em `createGeneralTaskAction`.
