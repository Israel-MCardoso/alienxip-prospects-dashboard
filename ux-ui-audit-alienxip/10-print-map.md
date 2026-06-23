# 10 - Print Map

## Telas para print manual

Tela: Login  
Rota: `/os/login`  
Print necessario: tela completa com painel visual/Spline, formulario, logo e estado dark.  
Observacoes: capturar tambem mobile se possivel.

Tela: Mission Control  
Rota: `/os`  
Print necessario: sidebar, header, KPIs, areas operacionais e cards de atalhos.  
Observacoes: importante para redesenho estilo HubSpot home.

Tela: Dashboard  
Rota: `/os/dashboard`  
Print necessario: cards de metricas e listas/resumos.  
Observacoes: verificar diferenca entre `/os` e `/os/dashboard`.

Tela: Prospects CRM  
Rota: `/os/prospects`  
Print necessario: filtros, lista de prospects, inline status/temperatura, selecao em lote.  
Observacoes: capturar com dados e com drawer de criacao aberto.

Tela: Drawer Novo Prospect  
Rota: `/os/prospects`  
Print necessario: drawer/bottom sheet com `ProspectForm`.  
Observacoes: capturar desktop e mobile.

Tela: Drawer Editar Prospect  
Rota: `/os/prospects`  
Print necessario: item selecionado e formulario de edicao.  
Observacoes: importante para padrao de edicao CRM.

Tela: Modal Envio Outreach  
Rota: `/os/prospects`  
Print necessario: modal de confirmacao de envio, contadores de elegiveis e seletor de ambiente.  
Observacoes: contem select nativo.

Tela: Pipeline Kanban  
Rota: `/os/prospects/pipeline`  
Print necessario: board completo com colunas e cards.  
Observacoes: capturar scroll horizontal e estado de drag se possivel.

Tela: Ficha do Prospect  
Rota: `/os/prospects/[id]`  
Print necessario: dados principais, notas, diagnostico, atividades, tarefas e propostas.  
Observacoes: base para redesenho HubSpot record page.

Tela: Empresas  
Rota: `/os/companies`  
Print necessario: lista e formulario de criacao.  
Observacoes: comparar com clientes.

Tela: Empresa Detalhe  
Rota: `/os/companies/[id]`  
Print necessario: formulario de edicao e relacoes com clientes/projetos.  
Observacoes: verificar se parece ficha CRM.

Tela: Clientes  
Rota: `/os/clients`  
Print necessario: lista de clientes, filtros e links.  
Observacoes: capturar estado com dados.

Tela: Cliente Detalhe  
Rota: `/os/clients/[id]`  
Print necessario: dados do cliente, projetos, arquivos e acoes.  
Observacoes: chave para redesenho HubSpot.

Tela: Projetos  
Rota: `/os/projects`  
Print necessario: lista/filtros/formulario de projeto.  
Observacoes: capturar cards ou tabela conforme render.

Tela: Projeto Workspace  
Rota: `/os/projects/[id]`  
Print necessario: detalhes, tarefas, notas, arquivos, wiki links.  
Observacoes: avaliar similaridade com ficha de cliente.

Tela: Tarefas  
Rota: `/os/tasks`  
Print necessario: filtros, formulario e lista de tarefas.  
Observacoes: capturar estados de prioridade/status.

Tela: Calendario  
Rota: `/os/calendar`  
Print necessario: agrupamentos por periodo.  
Observacoes: avaliar se deve virar calendario real.

Tela: Atividades  
Rota: `/os/activity`  
Print necessario: filtros e timeline.  
Observacoes: existem selects nativos.

Tela: Outreach Center  
Rota: `/os/outreach`  
Print necessario: metricas, listas de status, auditoria/batches se visiveis.  
Observacoes: importante para SDR.

Tela: SDR Command Center  
Rota: `/os/outreach/sdr-command-center`  
Print necessario: filtros, metric cards, tabela/lista de leads, tabs e painel de saude.  
Observacoes: capturar select nativo e checkboxes.

Tela: Outreach Settings  
Rota: `/os/outreach/settings`  
Print necessario: painel completo de configuracao/readiness.  
Observacoes: verificar se e settings tecnico ou operacional.

Tela: Tech Center  
Rota: `/os/tech`  
Print necessario: KPIs e cards dos submodulos.  
Observacoes: capturar estilo atual.

Tela: Bugs  
Rota: `/os/tech/bugs`  
Print necessario: formulario, filtros, tabela e inline actions.  
Observacoes: verificar selects nativos/customizados.

Tela: Incidentes  
Rota: `/os/tech/incidents`  
Print necessario: formulario, tabela e edicao.  
Observacoes: avaliar severidade/status.

Tela: Backlog Tecnico  
Rota: `/os/tech/backlog`  
Print necessario: formulario e tabela/lista.  
Observacoes: Nao encontrado se ha board.

Tela: Roadmap  
Rota: `/os/tech/roadmap`  
Print necessario: formulario, tabela e edicao.  
Observacoes: importante para visao executiva.

Tela: Decisoes Tecnicas  
Rota: `/os/tech/decisions`  
Print necessario: ADRs, tabela e modal/form de edicao.  
Observacoes: capturar status.

Tela: Wiki  
Rota: `/os/wiki`  
Print necessario: filtros e lista de paginas.  
Observacoes: capturar detalhe tambem.

Tela: Wiki Detalhe  
Rota: `/os/wiki/[slug]`  
Print necessario: conteudo completo da pagina.  
Observacoes: verificar legibilidade.

Tela: Playbooks  
Rota: `/os/playbooks`  
Print necessario: filtros/lista.  
Observacoes: capturar detalhe.

Tela: Arquivos  
Rota: `/os/files`  
Print necessario: filtros e lista de arquivos.  
Observacoes: existe select nativo.

Tela: Mobile geral  
Rota: `/os`, `/os/prospects`, `/os/prospects/pipeline`  
Print necessario: 390px e 430px com menu aberto/fechado.  
Observacoes: verificar overflow, drawers e kanban.
