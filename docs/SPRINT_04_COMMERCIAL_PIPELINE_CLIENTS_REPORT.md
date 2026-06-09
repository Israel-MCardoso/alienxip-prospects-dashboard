# Sprint 04 Commercial Pipeline Clients Report

## Objetivo

Evoluir a ALIENXIP OS de CRM basico para operacao comercial inicial com pipeline visual, follow-ups e conversao de prospect para empresa/cliente, preservando o dashboard legado.

## Branch e Checkpoint

- Branch criada: `sprint/04-commercial-pipeline-clients`
- Checkpoint antes das mudancas: commit `5280fc7` (`feat: add prospect workspace diagnostics notes timeline`)

## Migrations Criadas

Criada:

```text
supabase/migrations/20260609010000_sprint_04_commercial_pipeline_clients.sql
```

Alteracoes:

- adiciona status comerciais ao enum `prospect_status`:
  - `frio`
  - `contato_inicial`
  - `diagnostico`
  - `proposta`
  - `negociacao`
  - `fechado`
  - `perdido`
- adiciona atividades:
  - `task_created`
  - `task_completed`
  - `converted_to_client`
- cria enums:
  - `commercial_task_status`
  - `commercial_task_priority`
  - `client_status`
  - `contract_status`
- cria tabelas:
  - `commercial_tasks`
  - `companies`
  - `clients`
- adiciona em `prospects`:
  - `converted_company_id`
  - `converted_client_id`
  - `converted_at`

## Politicas RLS Adicionadas

RLS habilitado em:

- `companies`
- `clients`
- `commercial_tasks`

Policies:

- autenticados podem ler companies, clients e commercial_tasks;
- autenticados podem criar companies, clients e commercial_tasks;
- autenticados podem atualizar companies e clients;
- responsaveis/criadores/admins podem atualizar commercial_tasks;
- delete de tasks nao foi exposto nesta sprint.

## Rotas Novas

- `/os/prospects/pipeline`
- `/os/clients/[id]`
- `/os/companies`
- `/os/companies/[id]`

Rotas mantidas:

- `/os/prospects`
- `/os/prospects/[id]`
- `/api/prospects`
- `/`

## O Que Foi Criado

### Pipeline Kanban

Criado em:

- `app-next/src/features/commercial/pipeline-board.tsx`
- `app-next/src/app/os/(protected)/prospects/pipeline/page.tsx`

Funcionalidades:

- agrupa prospects por status comercial;
- mostra colunas vazias;
- mostra temperatura;
- mostra responsavel;
- mostra proxima tarefa/follow-up quando existe;
- permite abrir workspace do prospect.

Drag-and-drop nao foi implementado nesta sprint para evitar complexidade e risco.

### Follow-ups/Tarefas

Criado usando tabela `commercial_tasks`.

No workspace do prospect:

- cria tarefa;
- lista tarefas ligadas ao prospect;
- mostra prazo e prioridade;
- marca tarefa como concluida;
- registra atividade quando tarefa e criada ou concluida.

### Conversao Prospect para Cliente

No workspace do prospect:

- botao/formulario `Converter em Cliente`;
- cria `company`;
- cria `client`;
- vincula `converted_company_id`, `converted_client_id` e `converted_at` ao prospect;
- muda status para `fechado`;
- registra atividade `converted_to_client`;
- evita duplicidade se `converted_client_id` ja existe.

### Clients e Companies

Paginas simples criadas:

- lista de clientes;
- detalhe de cliente;
- lista de empresas;
- detalhe de empresa.

## Schemas e Helpers

Criados:

- `app-next/src/features/commercial/commercial-helpers.mjs`
- `app-next/src/features/commercial/commercial-helpers.ts`

Incluem:

- `taskSchema`
- `conversionSchema`
- `groupProspectsByPipelineStatus`
- `canConvertProspect`
- `buildCompanyClientFromProspect`

## Testes

Criado:

- `tests/commercial-pipeline.test.mjs`

Cobertura:

- validacao de task;
- agrupamento kanban;
- conversao evitando duplicidade;
- payload company/client a partir do prospect.

## Como Testar Pipeline

1. Aplicar migrations ate Sprint 4.
2. Rodar app:

```bash
npm run dev
```

3. Acessar:

```text
http://localhost:3000/os/prospects/pipeline
```

4. Confirmar colunas:

- Frio
- Contato inicial
- Diagnostico
- Proposta
- Negociacao
- Fechado
- Perdido

## Como Testar Tarefas

1. Abrir `/os/prospects`.
2. Abrir um prospect.
3. Ir para aba `Follow-ups`.
4. Criar tarefa.
5. Confirmar tarefa na lista.
6. Marcar como concluida.
7. Conferir atividade na Timeline.

## Como Testar Conversao

1. Abrir um prospect.
2. Ir para aba `Follow-ups`.
3. Preencher formulario de conversao.
4. Clicar em `Converter em Cliente`.
5. Abrir `/os/clients` e `/os/companies`.
6. Confirmar cliente/empresa criados.
7. Conferir Timeline do prospect.

## Riscos

- Status comerciais foram adicionados ao enum existente em vez de substituir os antigos para manter compatibilidade.
- O Kanban nao tem drag-and-drop ainda.
- Conversao nao usa transacao SQL/RPC; se uma etapa falhar em ambiente real, pode exigir limpeza manual.
- RLS de tasks permite edicao por responsavel/criador/admin, mas ainda precisa ser validada com Supabase dev real.
- Sem credenciais reais, a validacao local cobre build/tipos/testes, nao operacao real de banco.

## Pendencias

1. Criar RPC transacional para conversao prospect -> company/client.
2. Implementar drag-and-drop seguro no pipeline.
3. Criar pagina de tarefas geral.
4. Refinar policies por ownership e role.
5. Criar testes de RLS com Supabase local.
6. Adicionar filtros no pipeline.
7. Melhorar relacionamento visual entre client e company.

## Recomendacao para Sprint 5

Criar gestao operacional de tarefas e projetos:

- pagina `/os/tasks`;
- backlog de follow-ups;
- calendario/prazos;
- atribuicao por usuario;
- primeira estrutura de projects;
- conversao de cliente em projeto;
- RLS mais granular por owner/role.
