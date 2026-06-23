# 01 - Visao Geral

## Stack principal

- Framework: Next.js App Router.
- Linguagem principal: TypeScript.
- UI: React, Tailwind CSS, Base UI, componentes locais em `app-next/src/components/ui`.
- Dados e auth: Supabase Auth + Supabase Postgres.
- Deploy atual documentado: Railway, com Next standalone.
- Pasta principal do produto: `app-next/`.
- Arquivos legados mantidos na raiz: `index.html`, `api/prospects.js` e scripts de compatibilidade.

## Organizacao do projeto

- `app-next/src/app`: rotas Next.js, incluindo `/os`, `/os/login`, APIs e paginas protegidas.
- `app-next/src/components`: componentes reutilizaveis de layout, UI e visual.
- `app-next/src/features`: modulos funcionais do produto, separados por dominio.
- `app-next/src/lib`: clientes Supabase, AI provider, utilitarios, site URL e integracoes de outreach.
- `app-next/src/types`: tipos globais, incluindo `database.ts`.
- `supabase/migrations`: schema, RLS e evolucoes do banco.
- `tests`: testes Node para modulos e fluxos.
- `docs`: runbooks, relatorios de sprint, arquitetura, deploy, AI e outreach.

## Principais rotas/telas

- `/os/login`: login.
- `/os/reset-password`: redefinicao de senha.
- `/os`: Mission Control / home operacional.
- `/os/dashboard`: dashboard consolidado.
- `/os/prospects`: CRM de prospects.
- `/os/prospects/pipeline`: kanban/funil comercial.
- `/os/prospects/[id]`: ficha do prospect.
- `/os/clients`, `/os/clients/[id]`: clientes.
- `/os/companies`, `/os/companies/[id]`: empresas.
- `/os/projects`, `/os/projects/[id]`: projetos.
- `/os/tasks`: tarefas.
- `/os/calendar`: calendario.
- `/os/activity`: feed de atividades.
- `/os/outreach`: central de outreach.
- `/os/outreach/sdr-command-center`: SDR Command Center.
- `/os/outreach/settings`: configuracoes de outreach.
- `/os/tech`: Tech Center.
- `/os/tech/bugs`, `/os/tech/incidents`, `/os/tech/backlog`, `/os/tech/roadmap`, `/os/tech/decisions`: submodulos tecnicos.
- `/os/wiki`, `/os/wiki/[slug]`: wiki.
- `/os/playbooks`, `/os/playbooks/[id]`: playbooks.
- `/os/files`: arquivos.
- `/os/settings`: placeholder/configuracoes.

## Modulos existentes hoje

- Autenticacao.
- Layout OS / Mission Control.
- Prospects CRM.
- Pipeline comercial em Kanban.
- Empresas.
- Clientes.
- Tarefas.
- Projetos.
- Calendario.
- Atividades.
- Outreach e SDR.
- Tech Center.
- Knowledge Hub: wiki, playbooks e arquivos.
- AI Brain / sandbox de IA.
- Governanca e dados auxiliares.

## Como o sistema funciona do ponto de vista do usuario

1. O usuario entra em `/os/login`.
2. Apos login via Supabase, cai no ambiente protegido `/os`.
3. O layout apresenta sidebar lateral, header fixo, busca global, alternancia de tema e botao de sair.
4. O usuario navega por areas operacionais: prospects, funil, tarefas, projetos, clientes, empresas, tech, wiki, arquivos e outreach.
5. No CRM, consegue criar e editar prospects, mudar status/temperatura inline, abrir ficha detalhada e enviar leads para automacao.
6. No funil, consegue mover cards entre etapas por drag and drop.
7. Em projetos/tarefas, acompanha execucao, prazos, responsaveis e atividades.
8. Em Tech, registra e acompanha bugs, incidentes, backlog, roadmap e decisoes.
9. Em Knowledge, consulta e registra wiki, playbooks e arquivos.

## Observacoes

- Cadastro publico de usuarios: Nao encontrado no projeto.
- Criacao segura de usuarios: existe script admin em `scripts/supabase-create-user.mjs`.
- Permissao granular por area funcional como Comercial/Design/Tech/Founder: Nao encontrado no projeto como UX final.
