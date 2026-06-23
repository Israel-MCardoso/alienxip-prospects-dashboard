# 03 - Menu e Navegacao

## Menu lateral atual

Arquivo: `app-next/src/components/layout/os-shell.tsx`.

Ordem atual dos itens:

1. Inicio -> `/os`
2. Painel -> `/os/dashboard`
3. Prospects -> `/os/prospects`
4. Funil de Vendas -> `/os/prospects/pipeline`
5. SDR Command Center -> `/os/outreach/sdr-command-center`
6. Outreach Settings -> `/os/outreach/settings`
7. Tarefas -> `/os/tasks`
8. Calendario -> `/os/calendar`
9. Atividades -> `/os/activity`
10. Clientes -> `/os/clients`
11. Empresas -> `/os/companies`
12. Projetos -> `/os/projects`
13. Tecnologia -> `/os/tech`
14. Wiki -> `/os/wiki`
15. Playbooks -> `/os/playbooks`
16. Arquivos -> `/os/files`
17. Configuracoes -> `/os/settings`

## Comportamento do menu lateral

- Desktop: sidebar fixa, colapsavel, com tooltip quando colapsada.
- Mobile: drawer lateral aberto por botao no header.
- Estado ativo: compara `pathname === item.href`.
- Persistencia do colapso: `localStorage` com chave `sidebar-collapsed`.
- Logo MOTHERXIP no topo.
- Rodape da sidebar: `MOTHERXIP OS` e `MISSION CONTROL v12.5`.

## Menu superior

Arquivo: `app-next/src/components/layout/os-shell.tsx`.

Elementos:

- Botao hamburger no mobile.
- Identificacao `MOTHERXIP`.
- E-mail do usuario autenticado.
- Role do usuario com `roleLabel`.
- Botao de alternancia Light/Dark.
- `GlobalSearch`.
- Botao `Sair`.

## Busca global

Arquivo: `app-next/src/components/layout/global-search.tsx`.

Dados carregados no layout protegido:

- `getGlobalSearchData()` de workspace.
- `getTechSearchData()` de tech.
- `getKnowledgeSearchData()` de knowledge.

Objetivo: procurar entidades entre prospects, empresas, clientes, projetos, tarefas, bugs, incidentes, wiki, playbooks e arquivos.

## Botoes e links internos importantes

- Mission Control: cards de area e cards KPI levam para modulos especificos.
- Prospects: botoes `Novo Prospect`, `Abrir`, `Editar`, selecao em lote e envio para automacao.
- Pipeline: cards de lead levam para `/os/prospects/[id]`.
- Clientes/Empresas: links para detalhe e botoes de edicao/criacao.
- Projetos: links para workspace do projeto.
- Tech Center: cards para Bugs, Incidentes, Backlog, Roadmap, Decisoes e Deployments.
- Knowledge: links para Wiki, Playbooks e Files.

## Itens confusos, repetidos ou mal posicionados

1. `Painel` e `Inicio` parecem sobrepostos conceitualmente.
   - Onde: sidebar.
   - Impacto: usuario pode nao saber se deve comecar em `/os` ou `/os/dashboard`.
   - Sugestao: definir `Inicio` como resumo pessoal e `Dashboard` como relatorio executivo, ou unificar.

2. `SDR Command Center` e `Outreach Settings` aparecem no nivel raiz da sidebar.
   - Onde: sidebar.
   - Impacto: aumenta densidade do menu e mistura configuracao com operacao.
   - Sugestao: criar grupo "Outreach" com subitens, estilo HubSpot.

3. `Clientes` e `Empresas` ficam depois de atividades/calendario.
   - Onde: sidebar.
   - Impacto: CRM perde hierarquia.
   - Sugestao: agrupar CRM: Prospects, Pipeline, Empresas, Clientes, Outreach.

4. `Configuracoes` fica no fim, mas `Outreach Settings` fica no meio.
   - Onde: sidebar.
   - Impacto: duas formas de settings competem.
   - Sugestao: manter settings gerais no fim e settings de modulo dentro do grupo respectivo.

5. Atalhos de teclado exibidos como `Cmd+numero` visualmente aparecem com caracteres quebrados em alguns ambientes.
   - Onde: tooltip/kbd da sidebar.
   - Impacto: poluicao visual.
   - Sugestao: revisar encoding e utilidade real dos atalhos.
