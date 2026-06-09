# Sprint 5 - Tasks Center, Projetos por Cliente e Calendario Operacional

## Objetivo

Evoluir a ALIENXIP OS com uma camada operacional para tarefas, calendario e projetos por cliente, preservando o dashboard legado, a API `/api/prospects` e os modulos ja entregues nas sprints anteriores.

## O que foi criado

- Rota `/os/tasks` com lista geral de tarefas, filtros, criacao de tarefas e bloco "Minhas tarefas".
- Rota `/os/calendar` com agrupamento operacional por tarefas atrasadas, hoje, proximos 7 dias e sem data.
- Rota `/os/projects` com lista de projetos, filtros, resumo por status e criacao de projeto.
- Rota `/os/projects/[id]` com workspace inicial do projeto.
- Bloco de projetos em `/os/clients/[id]`, incluindo criacao de projeto vinculado ao cliente.
- Navegacao lateral para Tarefas e Calendario.
- Camada `src/features/operations` para helpers, data fetching, actions, formularios e componentes da Sprint 5.
- Migration SQL versionada para `projects`, `project_activities` e `commercial_tasks.project_id`.
- Testes de helpers para calendario, schema de projeto, agrupamento de projetos e progresso por tarefas.

## Rotas novas

- `/os/tasks`
- `/os/calendar`
- `/os/projects/[id]`

## Banco de dados

Migration criada:

- `supabase/migrations/20260609013000_sprint_05_tasks_projects_calendar.sql`

Mudancas:

- Enum `project_status`: `planning`, `active`, `paused`, `completed`, `canceled`.
- Enum `project_priority`: `low`, `medium`, `high`, `urgent`.
- Tabela `projects`.
- Tabela `project_activities`.
- Coluna `project_id` em `commercial_tasks`.
- Indices para status, prioridade, prazo, responsavel, cliente, empresa e projeto.
- RLS habilitado em `projects` e `project_activities`.
- Policies para leitura, criacao e atualizacao autenticada conforme ownership/admin.

## Decisoes tecnicas

- `commercial_tasks` foi mantida como tabela principal de tarefas para evitar duplicacao prematura.
- `project_id` foi adicionado em `commercial_tasks` para permitir vinculo com projetos sem quebrar tarefas comerciais ja existentes.
- `project_activities` foi criada para registrar eventos de projeto sem misturar tudo em `prospect_activities`.
- As paginas usam Server Components e Server Actions, seguindo o padrao ja adotado na ALIENXIP OS.
- Filtros foram implementados via query string para manter as telas simples e previsiveis.

## Como testar

1. Rodar testes automatizados:

   ```bash
   npm test
   ```

2. Rodar lint:

   ```bash
   npm run lint
   ```

3. Rodar build completo:

   ```bash
   npm run build
   ```

4. Subir a ALIENXIP OS localmente:

   ```bash
   npm run dev
   ```

5. Validar manualmente:

- Acessar `/os/tasks`.
- Criar uma tarefa sem projeto.
- Criar um projeto em `/os/projects`.
- Criar uma tarefa vinculada ao projeto.
- Abrir `/os/projects/[id]` e conferir tarefas vinculadas.
- Concluir uma tarefa e conferir progresso/timeline.
- Acessar `/os/calendar` e conferir agrupamentos por data.
- Abrir `/os/clients/[id]` e criar projeto vinculado ao cliente.

## Limites atuais

- Ainda nao ha tela dedicada para editar uma tarefa existente.
- O workspace de projeto possui placeholders para arquivos e notas.
- A tela de projeto ainda exibe cliente/empresa por ID no detalhe; enriquecimento visual pode entrar na Sprint 6.
- As atividades de projeto sao registradas por actions da aplicacao; nao ha triggers SQL automaticas para alteracoes feitas fora do app.
- Permissoes estao em um modelo inicial de authenticated users + owner/creator/admin para update.

## Riscos

- Ambientes Supabase existentes precisam aplicar a migration antes de usar projetos em producao.
- Se houver registros antigos em `commercial_tasks`, eles continuam validos com `project_id = null`.
- A coluna `project_id` depende da migration da Sprint 4 ja ter criado `commercial_tasks`.

## Pendencias para Sprint 6

- Edicao completa de tarefas.
- Edicao completa de projetos.
- Notas reais de projeto.
- Arquivos com Supabase Storage.
- Timeline unificada entre cliente, projeto e tarefa.
- Melhorar exibicao de cliente/empresa no workspace do projeto.
- Criar dashboards operacionais com carga por responsavel e SLA.

## Recomendacao para Sprint 6

Priorizar o fechamento do ciclo operacional de projetos: edicao de projeto, edicao de tarefas, notas de projeto, timeline unificada e painel de carga por responsavel. Isso transforma o modulo de projetos em um workspace utilizavel no dia a dia antes de adicionar automacoes ou integracoes externas.
