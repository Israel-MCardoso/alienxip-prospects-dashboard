# 06 - Fluxos do Usuario

## 1. Login

1. Usuario acessa `/os/login`.
2. Informa email e senha.
3. `LoginForm` chama `loginWithPasswordAction`.
4. Supabase autentica.
5. Usuario e redirecionado para `/os`.

## 2. Recuperar senha

1. Usuario acessa `/os/login`.
2. Informa email.
3. Clica em `Esqueci minha senha`.
4. `requestPasswordResetAction` chama Supabase reset.
5. Link aponta para `/os/reset-password`.

## 3. Visualizar dashboard / Mission Control

1. Usuario autenticado acessa `/os`.
2. `getDashboardOverview` busca prospects, clientes, projetos, tarefas, atividades, bugs, incidentes, arquivos, playbooks, profiles e outreach.
3. `WorkspaceHome` mostra KPIs e areas operacionais.
4. Usuario clica em cards para abrir modulos.

## 4. Criar lead/prospect

1. Usuario acessa `/os/prospects`.
2. Clica em `Novo Prospect`.
3. Drawer abre com `ProspectForm`.
4. Usuario preenche dados.
5. Form chama action de criacao em `features/prospects/actions.ts`.
6. Supabase grava em `prospects`.
7. Tela atualiza via `router.refresh()`.

## 5. Filtrar prospects

1. Usuario acessa `/os/prospects`.
2. Digita busca ou altera filtros de status/temperatura/outreach/meus prospects.
3. `ProspectsCrm` atualiza query params via `router.push`.
4. Busca textual tem debounce de 350ms.
5. Pagina recarrega dados filtrados no servidor.

## 6. Editar prospect

1. Usuario acessa `/os/prospects`.
2. Clica em `Editar` numa linha.
3. Drawer lateral/bottom sheet abre com `ProspectForm`.
4. Usuario altera dados.
5. Action atualiza `prospects`.
6. Drawer fecha e lista atualiza.

## 7. Mudar status/temperatura inline

1. Usuario acessa `/os/prospects`.
2. Usa `CustomSelect` de status ou temperatura no item da lista.
3. UI muda imediatamente.
4. Action grava no Supabase.
5. Se falhar, lista local reverte e mostra alerta.

## 8. Enviar prospects para outreach

1. Usuario acessa `/os/prospects`.
2. Seleciona prospects com `CustomCheckbox`.
3. Clica em envio/teste SDR.
4. Modal confirma elegiveis, leads sem WhatsApp e leads ja ativos.
5. Usuario escolhe ambiente.
6. Front chama `/api/outreach/dispatch`.
7. Sistema registra batches/eventos e atualiza status.

Observacao: esse modal ainda usa `<select>` nativo para ambiente.

## 9. Mover card no Kanban

1. Usuario acessa `/os/prospects/pipeline`.
2. Arrasta um card de prospect.
3. Solta em outra coluna.
4. `PipelineBoard` aplica optimistic update em `localProspects`.
5. Chama `updateProspectStatusAction`.
6. Se a action falhar, reverte para status anterior.

## 10. Abrir detalhes de um prospect

1. Usuario clica em `Abrir` ou no nome do lead.
2. Acessa `/os/prospects/[id]`.
3. `getProspectWorkspace` carrega dados relacionados.
4. Usuario visualiza ficha, notas, diagnostico, tarefas, atividades e propostas.

## 11. Criar empresa

1. Usuario acessa `/os/companies`.
2. Preenche formulario de empresa.
3. `createCompanyAction` grava em `companies`.
4. Tela revalida e mostra nova empresa.

## 12. Editar empresa

1. Usuario acessa `/os/companies/[id]`.
2. Edita campos como nome, segmento, cidade, site, Instagram, WhatsApp e notas.
3. `updateCompanyAction` persiste no Supabase.

## 13. Abrir detalhes de cliente

1. Usuario acessa `/os/clients`.
2. Abre um cliente.
3. Tela `/os/clients/[id]` carrega cliente, projetos, arquivos e playbooks.
4. Usuario pode editar cliente, arquivar/restaurar e criar projeto.

## 14. Criar tarefa

1. Usuario acessa `/os/tasks` ou contexto relacionado.
2. Preenche `TaskForm`.
3. `createGeneralTaskAction` grava em `commercial_tasks`.
4. Tarefa aparece na lista e calendario.

## 15. Criar projeto

1. Usuario acessa `/os/projects` ou ficha de cliente.
2. Preenche `ProjectForm`.
3. `createProjectAction` grava em `projects`.
4. Usuario pode abrir `/os/projects/[id]`.

## 16. Registrar atendimento/historico

1. Usuario opera prospect/tarefa/projeto/outreach.
2. Actions gravam eventos em `activities`, `prospect_activities`, `project_activities` ou `outreach_events`.
3. Usuario consulta historico em `/os/activity` ou nas fichas.

## 17. Gerar relatorio

- Fluxo formal de gerar relatorio exportavel: Nao encontrado no projeto.
- Existem dashboards e KPIs, mas nao foi encontrado botao de exportacao/relatorio final.

## 18. Criar bug/incidente/backlog/roadmap/decisao

1. Usuario acessa modulo em `/os/tech/*`.
2. Preenche formulario no topo da tela.
3. Action em `features/tech/actions.ts` grava no Supabase.
4. Lista/tabela atualiza.
5. Usuario pode editar, arquivar ou alterar status inline em alguns casos.
