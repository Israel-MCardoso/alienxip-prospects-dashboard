# 05 - CRM, Clientes e Empresas

## Entidades existentes

### Prospects / Leads

- Tabela: `prospects`.
- Tipos: `app-next/src/types/database.ts`, `app-next/src/features/prospects/data.ts`.
- Telas: `/os/prospects`, `/os/prospects/[id]`, `/os/prospects/[id]/edit`, `/os/prospects/pipeline`.
- Campos principais encontrados em actions/schema:
  - `name`
  - `status`
  - `temperature`
  - `segment`
  - `city`
  - `state`
  - `instagram_url`
  - `website_url`
  - `whatsapp`
  - `partner_name`
  - `partner_url`
  - `notes`
  - `owner_id`
  - `responsible_user_id`
  - campos de diagnostico e score
  - relacao com `prospect_outreach`

### Diagnosticos

- Tabela: `prospect_diagnostics`.
- Tela: ficha do prospect.
- Acoes: criar/atualizar diagnostico, inclusive com AI diagnostic action.

### Notas

- Tabela: `prospect_notes`.
- Tela: ficha do prospect.
- Acoes: criar e atualizar notas.
- Tipos: `observacao`, `follow_up`, `reuniao`, `decisao`, `risco`.

### Atividades do prospect

- Tabela: `prospect_activities`.
- Funcao: historico especifico do prospect.

### Empresas

- Tabela: `companies`.
- Telas: `/os/companies`, `/os/companies/[id]`.
- Campos principais:
  - `name`
  - `legal_name`
  - `segment`
  - `city`
  - `state`
  - `website_url`
  - `instagram_url`
  - `whatsapp`
  - `notes`
  - `owner_id`

### Clientes

- Tabela: `clients`.
- Telas: `/os/clients`, `/os/clients/[id]`.
- Campos principais:
  - `company_id`
  - `status`
  - `contract_status`
  - `monthly_value`
  - `start_date`
  - `main_contact_name`
  - `main_contact_email`
  - `main_contact_phone`
  - `owner_id`

### Tarefas

- Tabela: `commercial_tasks`.
- Telas: `/os/tasks`, ficha do prospect, projeto e cliente.
- Campos principais:
  - `prospect_id`
  - `company_id`
  - `client_id`
  - `project_id`
  - `owner_id`
  - `assigned_to`
  - `title`
  - `description`
  - `status`
  - `priority`
  - `due_date`
  - `completed_at`

### Propostas

- Tabela: `prospect_proposals`.
- Tela: ficha do prospect.
- Acoes: criar proposta comercial.
- Campos principais encontrados:
  - `prospect_id`
  - `title`
  - `value`
  - `valid_until`
  - `content`
  - `status`

### Outreach / Conversas / WhatsApp

- Tabelas: `prospect_outreach`, `outreach_events`, `outreach_batches`, `webhook_audit_logs`, `outreach_dead_letters`.
- Telas: `/os/outreach`, `/os/outreach/sdr-command-center`.
- Funcao: automacao SDR, status do contato, eventos, auditoria de webhook e batches.
- WhatsApp real: fluxo documentado via Evolution API/n8n, mas producao parece controlada por flags e sandbox.

## Relacionamentos principais

- `prospects` pode virar `companies` e `clients`.
- `clients` referencia `company_id`.
- `projects` pode se relacionar com `client_id` e `company_id`.
- `commercial_tasks` pode se vincular a prospect, company, client e project.
- `prospect_notes`, `prospect_diagnostics`, `prospect_activities`, `prospect_proposals` se vinculam ao prospect.
- `prospect_outreach` se vincula ao prospect.
- `outreach_events` se vincula a prospect e outreach.
- `files` podem se vincular a entidades por `entity_type` e `entity_id`.

## Criacao, edicao e visualizacao

### Prospect

- Criacao: botao `Novo Prospect` em `/os/prospects`, abre drawer com `ProspectForm`.
- Edicao: botao `Editar` abre drawer; tambem existe rota dedicada `/os/prospects/[id]/edit`.
- Visualizacao: link `Abrir` leva para `/os/prospects/[id]`.
- Inline actions: status e temperatura via `CustomSelect` com optimistic UI.

### Empresa

- Criacao: formulario na tela `/os/companies`.
- Edicao: tela `/os/companies/[id]` com `updateCompanyAction`.
- Visualizacao: lista e detalhe.

### Cliente

- Criacao direta: nao encontrada como tela dedicada; clientes surgem principalmente por conversao de prospect ou relacao comercial.
- Edicao: `/os/clients/[id]` com `updateClientAction`.
- Arquivar/restaurar: `archiveClientAction`, `restoreClientAction`.

### Tarefa

- Criacao: `TasksCenter`, `TaskForm`, ficha de prospect/projeto.
- Edicao: actions em `operations/actions.ts`.
- Conclusao: `completeGeneralTaskAction` e acoes relacionadas.

### Oportunidade / Negocio

- Oportunidade formal como entidade separada: Nao encontrado no projeto.
- O pipeline usa o proprio `prospect.status` como etapa de negocio.

## Kanban

- Existe Kanban em `PipelineBoard`.
- Caminho: `app-next/src/features/commercial/pipeline-board.tsx`.
- Rota: `/os/prospects/pipeline`.
- Colunas: `new`, `qualified`, `diagnostico`, `contato_inicial`, `meeting_scheduled`, `proposta`, `negociacao`, `fechado`, `perdido`.
- Drag and drop: sim, HTML5 drag/drop com `draggable`, `onDragStart`, `onDrop`.
- Atualizacao: optimistic UI e persistencia via `updateProspectStatusAction`.

## Timeline / historico

- Timeline global: `/os/activity` usa `activities`.
- Historico do prospect: `prospect_activities` na ficha do prospect.
- Historico de projeto: `project_activities`.
- Eventos de outreach: `outreach_events`.

## Tickets

- Entidade "ticket" nomeada assim: Nao encontrado no projeto.
- O equivalente operacional mais proximo sao `tech_bugs`, `tech_incidents` e `commercial_tasks`.
