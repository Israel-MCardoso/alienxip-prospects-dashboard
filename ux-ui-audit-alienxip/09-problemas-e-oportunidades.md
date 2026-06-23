# 09 - Problemas e Oportunidades

## Navegacao

### Menu lateral muito plano

- Onde: `app-next/src/components/layout/os-shell.tsx`.
- Problema: todos os modulos aparecem no mesmo nivel.
- Por que atrapalha: para uma UX inspirada no HubSpot, CRM, Marketing/Outreach, Operacao, Tech e Knowledge deveriam ter agrupamentos claros.
- Melhoria: criar grupos colapsaveis: CRM, Outreach, Operacao, Tech, Conhecimento, Configuracoes.

### Inicio e Painel podem confundir

- Onde: sidebar.
- Problema: `/os` e `/os/dashboard` parecem ambos dashboards.
- Melhoria: definir papel claro: Home pessoal vs Dashboard executivo, ou consolidar.

### Settings duplicado conceitualmente

- Onde: `/os/settings` e `/os/outreach/settings`.
- Problema: settings geral e settings de modulo aparecem misturados.
- Melhoria: mover settings de modulo para subnavegacao de Outreach.

## Layout

### Muitos estilos hardcoded

- Onde: varios arquivos de features usam `bg-[#08080a]`, `bg-black/60`, `border-white/5`.
- Problema: dificulta consistencia e light mode.
- Melhoria: criar tokens/componentes semanticos para page header, metric card, list row, command panel e status pill.

### Encoding quebrado em textos

- Onde: varios arquivos exibem caracteres como `Ã§`, `Ã£`.
- Problema: pode afetar UI e documentacao.
- Melhoria: normalizar encoding dos arquivos para UTF-8 em sprint separada.

## CRM

### Ficha do cliente ainda nao parece HubSpot

- Onde: `/os/clients/[id]`, `/os/companies/[id]`, `/os/prospects/[id]`.
- Problema: entidades existem, mas a experiencia ainda nao e uma ficha CRM unificada com coluna de propriedades, timeline central e painel lateral.
- Melhoria: redesenhar detalhe com layout HubSpot-like: propriedades a esquerda, timeline ao centro, atividades/associacoes a direita.

### Negocio/oportunidade nao e entidade separada

- Onde: pipeline usa `prospects.status`.
- Problema: limita multiplas oportunidades por empresa/cliente.
- Melhoria: criar entidade futura `deals` se o processo comercial crescer.

## Kanban

### Drag and drop nativo simples

- Onde: `app-next/src/features/commercial/pipeline-board.tsx`.
- Problema: funcional, mas pode ser limitado em mobile/acessibilidade.
- Melhoria: avaliar biblioteca robusta se o Kanban virar core operacional.

### Board horizontal pode ficar pesado

- Onde: `/os/prospects/pipeline`.
- Problema: muitas colunas com largura fixa podem gerar scroll extenso.
- Melhoria: adicionar zoom/compact mode, filtros por dono e agrupamento.

## Cliente/Empresa

### Contatos nao aparecem como entidade propria

- Onde: `clients` tem contato principal, mas nao ha tabela/tela de contatos.
- Problema: HubSpot trabalha fortemente com Contatos.
- Melhoria: modelar `contacts` quando necessario.

### Clientes e empresas separados, mas sem associacoes ricas

- Onde: `/os/clients`, `/os/companies`.
- Problema: relacoes existem, mas experiencia ainda parece administrativa.
- Melhoria: timeline unificada e associacoes visuais.

## Dashboard

### KPIs existem, mas nao ha graficos formais

- Onde: `DashboardCenter`, `WorkspaceHome`.
- Problema: para leitura executiva, cards podem nao bastar.
- Melhoria: adicionar graficos de funil, tendencia, conversao e volume por periodo.

### Relatorios/exportacao nao encontrados

- Onde: dashboards.
- Problema: nao ha fluxo de exportar ou gerar relatorio.
- Melhoria: criar relatorios salvos e export CSV/PDF futuramente.

## Mobile

### Sidebar mobile existe, mas tabelas/kanban podem gerar overflow

- Onde: Kanban, Tech pages, tabelas.
- Problema: telas densas podem exigir scroll horizontal.
- Melhoria: criar views mobile especificas em listas/cards.

### Drawers ja ajudam no CRM

- Onde: `ProspectsCrm`.
- Oportunidade: padronizar drawers/bottom sheets em outros modulos.

## Performance

### Busca global carrega muitos dados no layout

- Onde: `app-next/src/app/os/(protected)/layout.tsx`.
- Problema: layout busca dados globais de workspace, tech e knowledge em toda area protegida.
- Melhoria: lazy load da busca, endpoint sob demanda ou cache.

### Dashboard agrega muitas queries paralelas

- Onde: `features/workspace/data.ts`.
- Problema: pode crescer em custo conforme base aumenta.
- Melhoria: views/materialized views ou RPCs agregadas.

## Codigo

### Selects nativos ainda existem

- Onde:
  - `features/workspace/activity-feed.tsx`
  - `features/knowledge/files-page.tsx`
  - `features/prospects/prospects-crm.tsx` no modal de ambiente
  - `features/outreach/sdr-command-center.tsx`
  - `features/tech/tech-pages.tsx`
- Problema: inconsistencia com design system.
- Melhoria: migrar para `CustomSelect`.

### Permissao granular por area nao finalizada

- Onde: layout e navegacao.
- Problema: usuario autenticado ve menu completo.
- Melhoria: criar politica centralizada de roles/areas sem cadastro publico.

## Componentizacao

### Muitos padroes repetidos por modulo

- Onde: cards de metricas, page headers, filtros, empty states.
- Problema: dificulta redesenho consistente.
- Melhoria: criar kit operacional: `PageHeader`, `MetricGrid`, `FilterBar`, `EntityList`, `DetailLayout`, `Timeline`.

### TechPages concentra muita coisa

- Onde: `app-next/src/features/tech/tech-pages.tsx`.
- Problema: arquivo grande com varias telas e formularios.
- Melhoria: separar por submodulo em componentes menores.
