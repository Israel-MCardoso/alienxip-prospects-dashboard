# 04 - Componentes UI

## Layouts reutilizaveis

### OsShell

- Caminho: `app-next/src/components/layout/os-shell.tsx`
- Usado em: `app-next/src/app/os/(protected)/layout.tsx`
- Funcao: layout autenticado com sidebar, header, busca, tema e logout.
- Props principais: `children`, `isAuthConfigured`, `userEmail`, `userRole`, `searchData`.
- Dependencias: `GlobalSearch`, `logoutAction`, `roleLabel`, `framer-motion`, `lucide-react`, `next/link`, `next/image`.

### GlobalSearch

- Caminho: `app-next/src/components/layout/global-search.tsx`
- Usado em: `OsShell`.
- Funcao: busca global cross-module.
- Props principais: `data`.
- Dependencias: dados vindos de workspace, tech e knowledge.

### ModulePage

- Caminho: `app-next/src/features/os/module-page.tsx`
- Usado em: telas placeholder como `/os/settings`.
- Funcao: pagina padrao para modulo simples.

## Componentes base de UI

### Button

- Caminho: `app-next/src/components/ui/button.tsx`
- Usado em: praticamente todos os modulos.
- Funcao: botao base com variantes.
- Props principais: props do Base UI Button + variantes via `class-variance-authority`.
- Dependencias: `@base-ui/react/button`, `cva`, `cn`.

### Card

- Caminho: `app-next/src/components/ui/card.tsx`
- Usado em: dashboard, CRM, Tech, Knowledge, Outreach, Operations.
- Funcao: container visual padronizado.
- Subcomponentes: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent`.

### Badge

- Caminho: `app-next/src/components/ui/badge.tsx`
- Usado em: status, roles, etiquetas, severidade, tabs visuais.
- Funcao: indicador visual pequeno.
- Dependencias: Base UI `useRender`, `class-variance-authority`.

### Input

- Caminho: `app-next/src/components/ui/input.tsx`
- Usado em: filtros e formularios.
- Funcao: input padrao.

### Table

- Caminho: `app-next/src/components/ui/table.tsx`
- Usado em: paginas Tech e algumas listas.
- Funcao: tabela estruturada com header/body/row/cell.

### CustomSelect

- Caminho: `app-next/src/components/ui/custom-select.tsx`
- Usado em: `ProspectsCrm`, filtros e acoes inline; tambem em partes de `tech-pages.tsx`.
- Funcao: substitui select nativo em partes centrais do CRM.
- Props principais: `value`, `onChange`, `options`, `placeholder`, `triggerClassName`.
- Observacao: ainda existem selects nativos em algumas telas.

### CustomCheckbox

- Caminho: `app-next/src/components/ui/custom-checkbox.tsx`
- Usado em: `ProspectsCrm`.
- Funcao: checkbox customizado para selecao em lote.

### Tabs

- Caminho: `app-next/src/components/ui/tabs.tsx`
- Usado onde ha seccionamento por abas.
- Funcao: wrapper Base UI Tabs.

### DropdownMenu

- Caminho: `app-next/src/components/ui/dropdown-menu.tsx`
- Funcao: menu dropdown reutilizavel.

## Componentes por modulo

### LoginForm

- Caminho: `app-next/src/features/auth/login-form.tsx`
- Usado em: `/os/login`.
- Funcao: login e recuperacao de senha.
- Props: `isConfigured`, `initialMessage`.
- Dependencias: `loginWithPasswordAction`, `requestPasswordResetAction`, `Button`, `Input`.

### SplineScene

- Caminho: `app-next/src/components/visual/spline-scene.tsx`
- Usado em: login.
- Funcao: cena visual 3D/hero da tela de login.

### WorkspaceHome

- Caminho: `app-next/src/features/workspace/workspace-home.tsx`
- Usado em: `/os`.
- Funcao: Mission Control com KPIs, areas operacionais e atalhos.

### DashboardCenter

- Caminho: `app-next/src/features/workspace/dashboard-center.tsx`
- Usado em: `/os/dashboard`.
- Funcao: dashboard consolidado com cards e listas.

### ActivityFeed

- Caminho: `app-next/src/features/workspace/activity-feed.tsx`
- Usado em: `/os/activity`.
- Funcao: timeline de atividades com filtros.
- Observacao: usa selects nativos.

### ProspectsCrm

- Caminho: `app-next/src/features/prospects/prospects-crm.tsx`
- Usado em: `/os/prospects`.
- Funcao: lista CRM, filtros reativos, selecao em lote, inline actions, drawers.
- Componentes: `ProspectForm`, `CustomSelect`, `CustomCheckbox`, `Card`, `Button`, `Input`, `Badge`.

### ProspectForm

- Caminho: `app-next/src/features/prospects/prospect-form.tsx`
- Usado em: drawer de criar/editar e rota `/os/prospects/[id]/edit`.
- Funcao: formulario de prospect.

### ProspectWorkspace

- Caminho: `app-next/src/features/prospects/prospect-workspace.tsx`
- Usado em: `/os/prospects/[id]`.
- Funcao: ficha detalhada do prospect com dados, notas, diagnosticos, tarefas e propostas.

### PipelineBoard

- Caminho: `app-next/src/features/commercial/pipeline-board.tsx`
- Usado em: `/os/prospects/pipeline`.
- Funcao: kanban comercial com drag and drop nativo HTML5.
- Props: `prospects`, `tasks`, `error`.

### TasksCenter

- Caminho: `app-next/src/features/operations/tasks-center.tsx`
- Usado em: `/os/tasks`.
- Funcao: central de tarefas.

### TaskForm

- Caminho: `app-next/src/features/operations/task-form.tsx`
- Funcao: criar/editar tarefas.

### ProjectsList

- Caminho: `app-next/src/features/operations/projects-list.tsx`
- Usado em: `/os/projects`.
- Funcao: lista e criacao de projetos.

### ProjectWorkspace

- Caminho: `app-next/src/features/operations/project-workspace.tsx`
- Usado em: `/os/projects/[id]`.
- Funcao: ficha de projeto com tarefas, arquivos, notas e wiki links.

### ProjectForm

- Caminho: `app-next/src/features/operations/project-form.tsx`
- Funcao: formulario de projeto.

### CalendarView

- Caminho: `app-next/src/features/operations/calendar-view.tsx`
- Usado em: `/os/calendar`.
- Funcao: agrupamento de tarefas por periodo.

### TechCenter

- Caminho: `app-next/src/features/tech/tech-center.tsx`
- Usado em: `/os/tech`.
- Funcao: home do modulo tecnico.

### TechPages

- Caminho: `app-next/src/features/tech/tech-pages.tsx`
- Usado em: bugs, incidentes, backlog, roadmap e decisoes.
- Funcao: paginas CRUD/gestao tecnica.
- Observacao: mistura CustomSelect em alguns filtros com selects nativos em formularios.

### OutreachCenter

- Caminho: `app-next/src/features/outreach/outreach-center.tsx`
- Usado em: `/os/outreach`.
- Funcao: acompanhar e operar automacoes SDR.

### SdrCommandCenter

- Caminho: `app-next/src/features/outreach/sdr-command-center.tsx`
- Usado em: `/os/outreach/sdr-command-center`.
- Funcao: monitor operacional SDR sandbox.
- Observacao: usa inputs e selects nativos em filtros.

### OutreachSettingsPanel

- Caminho: `app-next/src/features/outreach/outreach-settings-panel.tsx`
- Usado em: `/os/outreach/settings`.
- Funcao: painel de configuracao/readiness de outreach.

### WikiList / WikiDetail

- Caminho: `app-next/src/features/knowledge/wiki-pages.tsx`
- Usado em: `/os/wiki` e `/os/wiki/[slug]`.

### PlaybooksPageView / PlaybookDetailView

- Caminho: `app-next/src/features/knowledge/playbooks-page.tsx`
- Usado em: `/os/playbooks` e detalhe.

### FilesPageView

- Caminho: `app-next/src/features/knowledge/files-page.tsx`
- Usado em: `/os/files`.
- Observacao: usa select nativo em filtros.

## Graficos

- Graficos formais com biblioteca dedicada: Nao encontrado no projeto.
- Existem cards de metricas/KPIs, mas nao foi encontrado uso de chart library.
