# 02 - Rotas e Paginas

## Rotas publicas

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Redirect inicial | `/` | `app-next/src/app/page.tsx` | Nao encontrado no trecho analisado | Entrada raiz do app | Geralmente redireciona/encaminha para OS |
| Login | `/os/login` | `app-next/src/app/os/login/page.tsx` | `LoginForm`, `SplineScene` | Autenticar usuarios internos | Informar email/senha, recuperar senha |
| Reset de senha | `/os/reset-password` | `app-next/src/app/os/reset-password/page.tsx` | Nao encontrado no resumo de imports | Redefinir senha Supabase | Definir nova senha |

## Layout protegido

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Layout OS | `/os/*` | `app-next/src/app/os/(protected)/layout.tsx` | `OsShell`, Supabase server client, busca global | Proteger rotas e montar shell | Navegar, buscar, alternar tema, sair |

## Mission Control e dashboard

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Mission Control | `/os` | `app-next/src/app/os/(protected)/page.tsx` | `WorkspaceHome`, `getDashboardOverview` | Home operacional por areas | Ver KPIs, acessar areas, abrir atalhos |
| Dashboard | `/os/dashboard` | `app-next/src/app/os/(protected)/dashboard/page.tsx` | `DashboardCenter` | Visao consolidada de metricas | Consultar indicadores e cards |
| Atividades | `/os/activity` | `app-next/src/app/os/(protected)/activity/page.tsx` | `ActivityFeed` | Timeline global de eventos | Filtrar atividades por ator, entidade e IDs |

## CRM comercial

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Prospects | `/os/prospects` | `app-next/src/app/os/(protected)/prospects/page.tsx` | `ProspectsCrm` | Listar e operar leads | Buscar, filtrar, criar, editar por drawer, mudar status/temperatura, selecionar em lote |
| Prospect detalhe | `/os/prospects/[id]` | `app-next/src/app/os/(protected)/prospects/[id]/page.tsx` | `ProspectWorkspace` | Ficha completa do lead | Ver diagnosticos, notas, tarefas, propostas, dados e historico |
| Editar prospect | `/os/prospects/[id]/edit` | `app-next/src/app/os/(protected)/prospects/[id]/edit/page.tsx` | `ProspectForm` | Edicao dedicada | Editar dados do prospect |
| Pipeline comercial | `/os/prospects/pipeline` | `app-next/src/app/os/(protected)/prospects/pipeline/page.tsx` | `PipelineBoard` | Funil em Kanban | Arrastar cards entre colunas, abrir ficha |
| Empresas | `/os/companies` | `app-next/src/app/os/(protected)/companies/page.tsx` | `Card`, `Input`, `Button`, `createCompanyAction` | Listar/criar empresas | Criar empresa, abrir detalhe |
| Empresa detalhe | `/os/companies/[id]` | `app-next/src/app/os/(protected)/companies/[id]/page.tsx` | `Card`, `Input`, `Button`, `updateCompanyAction` | Ficha da empresa | Editar dados, ver clientes/projetos relacionados |
| Clientes | `/os/clients` | `app-next/src/app/os/(protected)/clients/page.tsx` | `Card`, `Button`, `getClients` | Listar clientes | Filtrar meus clientes, abrir detalhe |
| Cliente detalhe | `/os/clients/[id]` | `app-next/src/app/os/(protected)/clients/[id]/page.tsx` | `ProjectForm`, `FileList`, `Card`, `Input`, actions comerciais | Ficha do cliente | Editar cliente, arquivar/restaurar, criar projeto, ver arquivos |

## Operacao

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Projetos | `/os/projects` | `app-next/src/app/os/(protected)/projects/page.tsx` | `ProjectsList` | Listar/criar projetos | Filtrar, criar projeto, abrir workspace |
| Projeto detalhe | `/os/projects/[id]` | `app-next/src/app/os/(protected)/projects/[id]/page.tsx` | `ProjectWorkspace`, `FileList`, wiki links | Workspace do projeto | Editar projeto, tarefas, notas, arquivos, wiki |
| Tarefas | `/os/tasks` | `app-next/src/app/os/(protected)/tasks/page.tsx` | `TasksCenter` | Central de tarefas | Criar, filtrar, editar, concluir, duplicar, arquivar |
| Calendario | `/os/calendar` | `app-next/src/app/os/(protected)/calendar/page.tsx` | `CalendarView` | Visualizar tarefas por data | Ver vencidas, hoje, proximas e sem data |

## Outreach / SDR

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Outreach Center | `/os/outreach` | `app-next/src/app/os/(protected)/outreach/page.tsx` | `OutreachCenter` | Monitorar automacao de prospeccao | Ver status, pausar/parar/retomar/testar fluxos |
| SDR Command Center | `/os/outreach/sdr-command-center` | `app-next/src/app/os/(protected)/outreach/sdr-command-center/page.tsx` | `SdrCommandCenter` | Controle operacional SDR sandbox | Filtrar leads, selecionar, revisar conversas, monitorar saude |
| Outreach Settings | `/os/outreach/settings` | `app-next/src/app/os/(protected)/outreach/settings/page.tsx` | `OutreachSettingsPanel` | Configuracoes operacionais do outreach | Ajustar/visualizar readiness e parametros |

## Tech Center

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Tech Center | `/os/tech` | `app-next/src/app/os/(protected)/tech/page.tsx` | `TechCenter` | Home tecnica | Acessar bugs, incidentes, backlog, roadmap, decisoes |
| Bugs | `/os/tech/bugs` | `app-next/src/app/os/(protected)/tech/bugs/page.tsx` | `BugsPageView` | Gerenciar bugs | Criar, editar, arquivar, alterar status/prioridade/severidade inline |
| Incidentes | `/os/tech/incidents` | `app-next/src/app/os/(protected)/tech/incidents/page.tsx` | `IncidentsPageView` | Gerenciar incidentes | Criar, editar, atualizar status, arquivar |
| Backlog tecnico | `/os/tech/backlog` | `app-next/src/app/os/(protected)/tech/backlog/page.tsx` | `BacklogPageView` | Gerenciar divida/infra/features | Criar, editar, arquivar |
| Roadmap | `/os/tech/roadmap` | `app-next/src/app/os/(protected)/tech/roadmap/page.tsx` | `RoadmapPageView` | Planejamento tecnico | Criar, editar, cancelar |
| Decisoes | `/os/tech/decisions` | `app-next/src/app/os/(protected)/tech/decisions/page.tsx` | `DecisionsPageView` | ADRs e decisoes tecnicas | Criar, editar, depreciar |

## Conhecimento

| Tela | Rota | Arquivo principal | Componentes usados | Objetivo | Acoes do usuario |
|---|---|---|---|---|---|
| Wiki | `/os/wiki` | `app-next/src/app/os/(protected)/wiki/page.tsx` | `WikiList` | Listar paginas internas | Filtrar, criar/editar conforme UI |
| Wiki detalhe | `/os/wiki/[slug]` | `app-next/src/app/os/(protected)/wiki/[slug]/page.tsx` | `WikiDetail` | Ler pagina wiki | Consultar conteudo |
| Playbooks | `/os/playbooks` | `app-next/src/app/os/(protected)/playbooks/page.tsx` | `PlaybooksPageView` | Listar playbooks | Filtrar e abrir playbook |
| Playbook detalhe | `/os/playbooks/[id]` | `app-next/src/app/os/(protected)/playbooks/[id]/page.tsx` | `PlaybookDetailView` | Ler playbook | Consultar processo |
| Arquivos | `/os/files` | `app-next/src/app/os/(protected)/files/page.tsx` | `FilesPageView` | Listar arquivos | Filtrar, remover arquivo com motivo |

## APIs

| API | Rota | Arquivo | Objetivo |
|---|---|---|---|
| Busca global | `/api/global-search` | `app-next/src/app/api/global-search/route.ts` | Buscar entidades do workspace |
| Dispatch outreach | `/api/outreach/dispatch` | `app-next/src/app/api/outreach/dispatch/route.ts` | Disparar leads para fluxo SDR/n8n |
| Webhook outreach | `/api/outreach/events` | `app-next/src/app/api/outreach/events/route.ts` | Receber eventos externos protegidos por segredo |
