# 11 - Resumo para ChatGPT

## Estrutura geral

O projeto e o MOTHERXIP OS / Alienxip Prospects, uma aplicacao interna da ALIENXIP feita em Next.js App Router, React, TypeScript, Tailwind CSS e Supabase. O deploy atual e Railway. A pasta principal e `app-next/`.

Principais pastas:

- `app-next/src/app`: rotas e paginas.
- `app-next/src/components`: UI, layout e visual.
- `app-next/src/features`: modulos de negocio.
- `app-next/src/lib`: Supabase, AI, outreach e utilitarios.
- `app-next/src/types/database.ts`: tipos do banco.
- `supabase/migrations`: schema Postgres/RLS.

## Principais telas

- Login: `/os/login`.
- Mission Control: `/os`.
- Dashboard: `/os/dashboard`.
- Prospects CRM: `/os/prospects`.
- Pipeline Kanban: `/os/prospects/pipeline`.
- Ficha do prospect: `/os/prospects/[id]`.
- Empresas: `/os/companies`, `/os/companies/[id]`.
- Clientes: `/os/clients`, `/os/clients/[id]`.
- Projetos: `/os/projects`, `/os/projects/[id]`.
- Tarefas: `/os/tasks`.
- Calendario: `/os/calendar`.
- Atividades: `/os/activity`.
- Outreach: `/os/outreach`.
- SDR Command Center: `/os/outreach/sdr-command-center`.
- Tech Center: `/os/tech` e subrotas.
- Wiki/playbooks/files: `/os/wiki`, `/os/playbooks`, `/os/files`.

## Principais componentes

- `OsShell`: sidebar, header, busca, tema e logout.
- `GlobalSearch`: busca global.
- `WorkspaceHome`: home operacional com KPIs/areas.
- `DashboardCenter`: dashboard consolidado.
- `ProspectsCrm`: lista CRM, filtros, drawers e inline actions.
- `ProspectForm`: formulario de lead.
- `ProspectWorkspace`: ficha do prospect.
- `PipelineBoard`: kanban comercial com drag/drop.
- `TasksCenter`, `ProjectsList`, `ProjectWorkspace`: operacao.
- `TechCenter`, `tech-pages.tsx`: bugs, incidentes, backlog, roadmap e decisoes.
- `OutreachCenter`, `SdrCommandCenter`: operacao SDR.
- `WikiList`, `PlaybooksPageView`, `FilesPageView`: conhecimento.
- UI base: `Button`, `Card`, `Badge`, `Input`, `Table`, `CustomSelect`, `CustomCheckbox`, `Tabs`.

## Como funciona o CRM atual

O CRM gira em torno de `prospects`. A tela `/os/prospects` lista leads, permite filtros reativos, edicao em drawer, criacao de novo prospect, selecao em lote e envio para automacao SDR. A ficha `/os/prospects/[id]` centraliza dados, notas, diagnostico, atividades, tarefas e propostas.

Empresas e clientes existem como entidades separadas:

- `companies`: dados da empresa.
- `clients`: cliente ativo relacionado a uma empresa.
- `commercial_tasks`: tarefas comerciais vinculadas a prospect, cliente, empresa ou projeto.

O pipeline comercial ainda usa `prospects.status` como etapa. Nao ha entidade separada de `deal`/negocio.

## Como funciona o Kanban atual

O Kanban fica em `/os/prospects/pipeline`, componente `PipelineBoard`. Ele agrupa prospects por status de pipeline, mostra cards com valor potencial, temperatura, segmento, cidade e proxima tarefa. Usa drag and drop HTML5. Ao mover um card, aplica optimistic UI e chama `updateProspectStatusAction`.

Colunas atuais:

- Novo Lead
- Qualificacao
- Diagnostico
- Primeiro Contato
- Reuniao Agendada
- Proposta Enviada
- Negociacao
- Fechado Ganho
- Fechado Perdido

## Como funciona a ficha do cliente

A ficha do cliente fica em `/os/clients/[id]`. Ela carrega o cliente, projetos relacionados, referencias de tarefas, arquivos e playbooks. Permite editar campos do cliente, arquivar/restaurar e criar projeto. Ainda nao parece uma record page estilo HubSpot completa; e mais uma tela administrativa com secoes relacionadas.

## O que ja existe parecido com HubSpot

- CRM de leads/prospects.
- Pipeline kanban.
- Ficha de prospect.
- Empresas e clientes.
- Tarefas e atividades.
- Timeline/historico via `activities`, `prospect_activities`, `project_activities`.
- Outreach/SDR com status de automacao.
- Busca global.
- Sidebar + areas operacionais.
- Inline status updates.
- Drawers para criar/editar prospects.

## O que falta para ficar mais parecido com HubSpot

- Agrupar menu por hubs: CRM, Marketing/Outreach, Operacao, Tech, Knowledge.
- Criar record page padrao para Prospect/Empresa/Cliente com:
  - propriedades principais;
  - timeline central;
  - associacoes laterais;
  - atividades, notas, tarefas, arquivos, propostas.
- Criar entidade formal de negocio/oportunidade se necessario.
- Melhorar tabela/lista de clientes e empresas.
- Padronizar todos os filtros com `CustomSelect`.
- Criar componentes compartilhados: `PageHeader`, `FilterBar`, `MetricCard`, `EntityRow`, `RecordLayout`, `Timeline`.
- Melhorar mobile do Kanban e tabelas.
- Adicionar relatorios/graficos/exportacao.
- Formalizar permissao por cargo/area sem cadastro publico.

## Arquivos que o ChatGPT precisa analisar

1. `app-next/src/components/layout/os-shell.tsx`
2. `app-next/src/features/workspace/workspace-home.tsx`
3. `app-next/src/features/workspace/dashboard-center.tsx`
4. `app-next/src/features/prospects/prospects-crm.tsx`
5. `app-next/src/features/prospects/prospect-workspace.tsx`
6. `app-next/src/features/prospects/prospect-form.tsx`
7. `app-next/src/features/commercial/pipeline-board.tsx`
8. `app-next/src/features/commercial/data.ts`
9. `app-next/src/features/commercial/actions.ts`
10. `app-next/src/features/operations/tasks-center.tsx`
11. `app-next/src/features/operations/projects-list.tsx`
12. `app-next/src/features/operations/project-workspace.tsx`
13. `app-next/src/features/outreach/outreach-center.tsx`
14. `app-next/src/features/outreach/sdr-command-center.tsx`
15. `app-next/src/features/tech/tech-center.tsx`
16. `app-next/src/features/tech/tech-pages.tsx`
17. `app-next/src/app/globals.css`
18. `app-next/src/types/database.ts`
19. `supabase/migrations/*`

## Sugestao de ordem de reconstrução UX/UI

1. Definir mapa de navegacao estilo HubSpot por hubs.
2. Criar layout padrao de record page.
3. Redesenhar Prospects CRM.
4. Redesenhar ficha do Prospect.
5. Redesenhar Pipeline Kanban.
6. Redesenhar Empresas e Clientes com associacoes.
7. Padronizar tarefas/atividades/timeline.
8. Redesenhar Outreach/SDR como hub proprio.
9. Padronizar Tech Center sem quebrar operacao.
10. Revisar Knowledge Hub.
11. Consolidar design system e remover hardcodes.
12. Fazer QA mobile e acessibilidade.
