# Sprint 06 - Unified Workspace & Operational Core

## Objetivo

Transformar os modulos existentes da ALIENXIP OS em um sistema operacional integrado, centralizando ownership, atividades, busca, dashboard e navegacao entre entidades.

## Decisoes tecnicas

- `owner_id` passa a ser o campo padrao de ownership para prospects, companies, clients, projects e commercial_tasks.
- `responsible_user_id` em prospects e `assigned_to` em tasks foram mantidos por compatibilidade.
- A nova tabela `activities` centraliza o feed operacional sem remover `prospect_activities` e `project_activities`.
- As actions existentes continuam gravando nas tabelas antigas quando necessario e tambem registram no feed global por meio de `recordActivity`.
- A busca global foi implementada no topbar com `Ctrl + K`, carregando um dataset operacional limitado para evitar complexidade prematura.
- O dashboard deixou de ser placeholder e agora consome metricas reais das tabelas existentes.
- O workspace de projeto ganhou metricas, progresso automatico, links cruzados e placeholders funcionais para Notes, Files e Settings.

## Migration

Arquivo:

- `supabase/migrations/20260609020000_sprint_06_unified_workspace_core.sql`

Mudancas:

- Adiciona `owner_id` em:
  - `prospects`
  - `companies`
  - `clients`
  - `commercial_tasks`
- Mantem `projects.owner_id` ja criado na Sprint 05.
- Faz backfill inicial:
  - `prospects.owner_id` a partir de `responsible_user_id`.
  - `commercial_tasks.owner_id` a partir de `assigned_to` ou `created_by`.
  - `clients.owner_id` e `companies.owner_id` a partir de prospects convertidos.
- Cria tabela `activities`.
- Migra registros existentes de `prospect_activities` e `project_activities` para `activities`.
- Cria indices para ownership, entidade, ator, action e data.
- Habilita RLS em `activities`.

## Rotas

Nova rota:

- `/os/activity`

Rotas evoluidas:

- `/os/dashboard`
- `/os/projects/[id]`
- `/os/prospects`
- `/os/clients`
- `/os/projects`
- `/os/tasks`

## Activity Feed

O feed global agrupa atividades em:

- Hoje
- Ontem
- Ultimos 7 dias

Filtros criados:

- Usuario
- Tipo de entidade
- Projeto
- Prospect
- Cliente por ID

## Dashboard operacional

Widgets criados:

- Prospects ativos
- Clientes ativos
- Projetos ativos
- Tarefas abertas
- Tarefas vencidas
- Tarefas para hoje
- Conversoes do mes
- Projetos concluidos

Blocos criados:

- Atividades recentes
- Minhas pendencias

Cards de ownership:

- Minhas tarefas abertas
- Minhas tarefas vencidas
- Meus prospects ativos
- Meus projetos ativos

## Busca global

Criado componente:

- `src/components/layout/global-search.tsx`

Atalho:

- `Ctrl + K`

Entidades pesquisadas:

- prospects
- companies
- clients
- projects
- tasks

## Relacionamentos e navegacao cruzada

Melhorias:

- Cliente lista projetos vinculados.
- Projeto aponta para cliente e empresa.
- Tarefa aponta para projeto, prospect e cliente quando houver vinculo.
- Prospect aponta para cliente convertido.
- Dashboard e Activity Feed apontam para os workspaces relevantes.

## Workspace de projeto

Melhorias em `/os/projects/[id]`:

- Overview com links para cliente e empresa.
- Tasks com links para prospect e cliente.
- Timeline consumindo `project_activities`.
- Notes como placeholder funcional.
- Files como placeholder funcional.
- Settings como placeholder.
- Progresso automatico baseado em tarefas concluidas.
- Metricas de tarefas abertas, concluidas, prazo e responsavel.

## Testes adicionados

Arquivo:

- `tests/unified-workspace.test.mjs`

Cobertura:

- Ownership helpers.
- Activity feed grouping.
- Dashboard metrics.
- Global search helpers.

## Validacao executada

Comandos:

```bash
npm test
npm run lint
npm run build
```

Status:

- Testes passaram.
- Lint passou.
- Build completo passou, incluindo legado e Next.

## Riscos

- Ambientes Supabase precisam aplicar a migration da Sprint 06 antes de usar feed global e ownership novo.
- O backfill de `activities` roda na migration; se a migration for repetida manualmente fora do controle de migrations, pode duplicar atividades.
- A busca global usa dataset limitado e nao substitui uma busca full-text.
- `clients` ainda nao possui uma pagina rica de company/contexto; apenas vinculos essenciais foram reforcados.
- Activities antigas continuam existindo por compatibilidade.

## Pendencias

- Criar triggers ou rotinas padronizadas para registrar activities quando updates ocorrerem fora das server actions.
- Enriquecer activity feed com nomes de entidades relacionadas em vez de apenas IDs.
- Criar notas persistentes de projeto.
- Criar storage real para arquivos.
- Implementar permissoes mais granulares por owner/team.
- Melhorar busca com Postgres full-text ou RPC dedicada.

## Recomendacao para Sprint 07

Priorizar o Tech Center e a maturidade operacional:

1. Criar workspace de Tech Center para bugs, incidentes, backlog tecnico e decisoes de arquitetura.
2. Criar notas persistentes de projeto e timeline unificada por entidade.
3. Implementar storage com Supabase Storage para anexos de prospects, clientes e projetos.
4. Criar policies RLS mais especificas por `owner_id`, role e tipo de entidade.
5. Evoluir a busca global para uma view/RPC no Postgres com full-text search.
6. Criar audit helpers para garantir que novas actions sempre registrem `activities`.
7. Preparar base para automacoes/IA somente depois do modelo operacional estar consistente.
