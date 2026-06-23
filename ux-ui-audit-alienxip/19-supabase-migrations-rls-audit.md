# 19 - Supabase Migrations & RLS Audit

## 1. Resumo executivo

O banco de dados do **MOTHERXIP OS / Alienxip CRM** está muito bem estruturado e cobre praticamente toda a complexidade do sistema, com RLS habilitado na maioria das tabelas, triggers automatizados para atualizar o campo `updated_at`, índices para a maior parte das chaves estrangeiras e relacionamentos estabelecidos com chaves estrangeiras apropriadas.

No entanto, para o banco de dados estar **pronto para produção**, existem alguns ajustes e correções críticas que precisam ser realizados:
1. **RLS Desabilitado em Tabela Crítica (Risco de Segurança Alto)**: A tabela `outreach_dead_letters` (Sprint 21) foi criada nas migrations sem a diretiva `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Isso significa que qualquer usuário com acesso ao client da API pública do Supabase pode ler, inserir ou deletar registros nesta tabela irrestritamente se RLS não for explicitamente habilitado.
2. **Brecha de Segurança (RLS Permissivo) em Proposals**: A tabela `prospect_proposals` possui RLS ativado, mas as policies de `INSERT` e `UPDATE` estão configuradas com a verificação de segurança genérica `WITH CHECK (true)`. Isso permite que qualquer usuário autenticado (inclusive usuários com a role de **viewer** ou perfis inativos) insira ou modifique propostas de qualquer prospect, quebrando a governança baseada em roles.
3. **Storage sem Migrations ou Policies (Falha Crítica de Funcionalidade)**: O bucket do Supabase Storage `alienxip-files` (usado no upload de arquivos) é referenciado e utilizado no código Next.js, mas não há nenhuma migration que crie este bucket ou estabeleça as devidas políticas de segurança na tabela `storage.objects`. Isso causará falha imediata na listagem e no upload de arquivos em qualquer deploy novo.
4. **Mapeamento de Tipos Desatualizado (Typescript)**: As tabelas `outreach_batches` (Sprint 18) e `outreach_dead_letters` (Sprint 21) existem nas migrations e no banco de dados, mas estão completamente ausentes do arquivo de definição de tipos [database.ts](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/app-next/src/types/database.ts), forçando o uso de tipagem genérica (`any` ou casting de objeto) no código e enfraquecendo a consistência estática da aplicação.
5. **Gaps de Índices de Performance**: Faltam índices nas chaves estrangeiras `company_id`, `client_id`, `project_id` e `owner_id` em tabelas operacionais volumosas (como `commercial_tasks` e `prospect_proposals`), o que pode degradar a performance das queries conforme a massa de dados cresça e o sistema pagine os resultados.

**Conclusão**: O banco de dados **não** está 100% pronto para produção de forma segura. A aplicação das migrations corretivas listadas neste relatório é fundamental antes do go-live oficial.

---

## 2. Tabelas existentes encontradas

Atualmente, existem **27 tabelas** declaradas no histórico de migrations da pasta [supabase/migrations](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/supabase/migrations):

| # | Tabela | Migration de Criação | Objetivo do Sistema |
|---|---|---|---|
| 1 | `profiles` | `20260608235900_sprint_02_prospects_core.sql` | Perfis de usuários internos sincronizados com auth.users |
| 2 | `prospects` | `20260608235900_sprint_02_prospects_core.sql` | Leads/Prospects do CRM comercial |
| 3 | `prospect_diagnostics` | `20260608235900_sprint_02_prospects_core.sql` | Diagnósticos de IA e notas de canais sociais do prospect |
| 4 | `prospect_notes` | `20260608235900_sprint_02_prospects_core.sql` | Anotações comerciais dos prospects |
| 5 | `prospect_activities` | `20260608235900_sprint_02_prospects_core.sql` | Registro histórico de atividades exclusivas do prospect (legado) |
| 6 | `companies` | `20260609010000_sprint_04_commercial_pipeline_clients.sql` | Empresas parceiras ou resultantes de conversão |
| 7 | `clients` | `20260609010000_sprint_04_commercial_pipeline_clients.sql` | Clientes ativos/antigos vinculados a empresas |
| 8 | `commercial_tasks` | `20260609010000_sprint_04_commercial_pipeline_clients.sql` | Tarefas e follow-ups comerciais |
| 9 | `projects` | `20260609013000_sprint_05_tasks_projects_calendar.sql` | Projetos ativos vinculados a clientes/empresas |
| 10 | `project_activities` | `20260609013000_sprint_05_tasks_projects_calendar.sql` | Histórico de atividades exclusivas do projeto (legado) |
| 11 | `activities` | `20260609020000_sprint_06_unified_workspace_core.sql` | Linha do tempo unificada de atividades do sistema |
| 12 | `tech_bugs` | `20260609023000_sprint_07_tech_center_reliability.sql` | Central de Bugs e defeitos técnicos |
| 13 | `tech_incidents` | `20260609023000_sprint_07_tech_center_reliability.sql` | Incidentes de produção técnicos |
| 14 | `tech_backlog_items` | `20260609023000_sprint_07_tech_center_reliability.sql` | Itens de backlog de engenharia (débito, refactor) |
| 15 | `tech_roadmap_items` | `20260609023000_sprint_07_tech_center_reliability.sql` | Planejamento de funcionalidades do roadmap técnico |
| 16 | `technical_decisions` | `20260609023000_sprint_07_tech_center_reliability.sql` | Registro de decisões arquiteturais técnicas (ADRs) |
| 17 | `project_notes` | `20260609023000_sprint_07_tech_center_reliability.sql` | Notas e relatórios vinculados a projetos |
| 18 | `files` | `20260609023000_sprint_07_tech_center_reliability.sql` | Metadados de arquivos vinculados a qualquer entidade do OS |
| 19 | `wiki_pages` | `20260609030000_sprint_08_knowledge_hub_storage_search.sql`| Central de páginas wiki da base de conhecimento |
| 20 | `playbooks` | `20260609030000_sprint_08_knowledge_hub_storage_search.sql`| Guias operacionais e playbooks comerciais |
| 21 | `project_wiki_links` | `20260609030000_sprint_08_knowledge_hub_storage_search.sql`| Vínculos muitos-para-muitos entre projetos e wikis |
| 22 | `prospect_proposals` | `20260611000000_sprint_12_proposals.sql` | Propostas comerciais feitas para os prospects |
| 23 | `prospect_outreach` | `20260611200000_sprint_16_n8n_outreach.sql` | Estado da automação de prospecção do lead via n8n |
| 24 | `outreach_events` | `20260611200000_sprint_16_n8n_outreach.sql` | Eventos de timeline de prospecção (SDR) |
| 25 | `webhook_audit_logs` | `20260611210000_sprint_16_5_webhook_audit.sql` | Histórico e auditoria de requisições de webhooks |
| 26 | `outreach_batches` | `20260611220000_sprint_18_outreach_hardening.sql` | Lotes de despachos de leads para prospecção em massa |
| 27 | `outreach_dead_letters` | `20260613090000_sprint_21_outreach_dead_letters.sql` | Registro de falhas críticas irrecuperáveis do outreach |

---

## 3. Tabelas usadas pelo código mas não encontradas

Não há nenhuma tabela que o código Next.js consuma via Supabase Client/Actions que não possua uma declaração `CREATE TABLE` correspondente nas migrations SQL analisadas. O histórico de migração cobre 100% do escopo de tabelas do código.

No entanto, destacamos um problema com o nível de prontidão da tabela abaixo:

| Tabela | Severidade | Impacto | Detalhes do Gap |
|---|---|---|---|
| `outreach_dead_letters` | **Médio** | Tabela declarada como "apenas preparada" na última migration, mas ainda sem RLS ativado ou policies, e não está tipada estaticamente na aplicação Next.js. | Embora criada no banco, está "morta" quanto à tipagem estática do compilador TS, precisando de sincronização de tipos e ativação de RLS. |

---

## 4. Colunas usadas pelo código mas não encontradas

### A. Gaps de Schema (Uso no Código vs Migration)
Não foram encontradas inconsistências entre as colunas selecionadas/modificadas pelo código Next.js e o schema real do banco de dados (todas as queries de tabelas batem exatamente com as definições de colunas das migrations).

### B. Gaps de Tipagem (Banco de Dados vs `database.ts`)
Existem tabelas e colunas que existem no banco de dados, mas **não aparecem nos tipos TypeScript (`types/database.ts`)**:

| Arquivo de Origem / Destino | Tabela | Coluna Ausente | Impacto no Compilador / Código |
|---|---|---|---|
| `src/types/database.ts` | `outreach_batches` | (Tabela inteira) | O compilador TS não reconhece o formato das linhas retornadas por `getOutreachBatches()` ou inseridas no dispatch da API. O código é forçado a usar cast `as any` ou tipos locais definidos fora do Supabase schema em `types/outreach.ts`. |
| `src/types/database.ts` | `outreach_dead_letters` | (Tabela inteira) | Sem representação no ecossistema TypeScript do projeto. Se houver necessidade futura de ler dados dela, ocorrerá erro de build. |

---

## 5. RLS atual

Análise do Row Level Security (RLS) configurado atualmente em cada uma das tabelas do banco de dados:

| Tabela | RLS Ativo? | Policies Encontradas | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|---|
| `profiles` | Sim | 2 policies (sprint 02) | Autenticados (se ativos) | Bloqueado | Dono do perfil | Bloqueado |
| `prospects` | Sim | 4 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers) | Admin ou Owner |
| `prospect_diagnostics` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers) | Bloqueado |
| `prospect_notes` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Autor do note ou Admin/Owner | Bloqueado |
| `prospect_activities` | Sim | 2 policies (sprint 11) | Autenticados (sem restrição) | Autenticados (sem restrição) | Bloqueado | Bloqueado |
| `companies` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers) | Bloqueado |
| `clients` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers) | Bloqueado |
| `commercial_tasks` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Responsável, Criador ou Admin/Owner | Bloqueado |
| `projects` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Responsável, Criador ou Admin/Owner | Bloqueado |
| `project_activities` | Sim | 2 policies (sprint 11) | Autenticados (sem restrição) | Autenticados (sem restrição) | Bloqueado | Bloqueado |
| `activities` | Sim | 2 policies (sprint 11) | Autenticados (sem restrição) | Autenticados (sem restrição) | Bloqueado | Bloqueado |
| `tech_bugs` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers, restrito a dono/admin) | Bloqueado |
| `tech_incidents` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers, restrito a dono/admin) | Bloqueado |
| `tech_backlog_items` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers, restrito a dono/admin) | Bloqueado |
| `tech_roadmap_items` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Ativos (não viewers, restrito a dono/admin) | Bloqueado |
| `technical_decisions` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Criador ou Admin/Owner | Bloqueado |
| `project_notes` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Autor do note ou Admin/Owner | Bloqueado |
| `files` | Sim | 3 policies (sprint 11/09)| Se ativo (e removed_at is null) | Ativos (não viewers) | Uploader, Operador ou Admin/Owner | Bloqueado (lógico) |
| `wiki_pages` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Criador/Updater ou Admin/Owner | Bloqueado |
| `playbooks` | Sim | 3 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Criador/Updater ou Admin/Owner | Bloqueado |
| `project_wiki_links` | Sim | 2 policies (sprint 11) | Autenticados (sem restrição) | Ativos (não viewers) | Bloqueado | Bloqueado |
| `prospect_proposals` | Sim | 3 policies (sprint 12) | Autenticados (sem restrição) | **Qualquer autenticado** (sprint 12) | **Qualquer autenticado** (sprint 12) | Bloqueado |
| `prospect_outreach` | Sim | 3 policies (sprint 16) | Autenticados (sem restrição) | Operador/Admin/Owner | Operador/Admin/Owner | Bloqueado |
| `outreach_events` | Sim | 2 policies (sprint 16) | Autenticados (sem restrição) | Operador/Admin/Owner | Bloqueado | Bloqueado |
| `webhook_audit_logs` | Sim | 1 policy (sprint 16.5) | Autenticados (sem restrição) | Bloqueado (Normal) | Bloqueado | Bloqueado |
| `outreach_batches` | Sim | 3 policies (sprint 18) | Autenticados (sem restrição) | Operador/Admin/Owner | Operador/Admin/Owner | Bloqueado |
| `outreach_dead_letters`| **Não** | **Nenhuma policy** | **Livre / Aberto** | **Livre / Aberto** | **Livre / Aberto** | **Livre / Aberto** |

*Nota sobre inserts automáticos de webhook*: Para `webhook_audit_logs`, os inserts são realizados via `createSupabaseAdminClient()`, o que ignora o RLS do Supabase, tornando a ausência de policy de INSERT para o usuário final uma boa prática de segurança.

---

## 6. Gaps de RLS

A auditoria identificou os seguintes gaps de segurança nas políticas RLS:

1. **`outreach_dead_letters`**:
   - **Problema**: O RLS não está ativado (`row level security` inativo). Qualquer cliente Supabase com a role `anon` ou `authenticated` tem poder de leitura, inserção e alteração direta por chamadas REST POST/GET na tabela.
   - **Solução**: Ativar RLS e criar uma policy vazia (ou permitir leitura somente para Admin/Service Role).
2. **`prospect_proposals`**:
   - **Problema**: A política de `INSERT` e `UPDATE` criada na Sprint 12 verifica apenas `WITH CHECK (true)` para `authenticated` users. Isso significa que um usuário cadastrado com a role `viewer` (que deveria ter acesso estritamente de leitura de dados comerciais do sistema) ou um usuário inativo (`is_active = false`) consegue gerar ou alterar propostas de valor comercial.
   - **Solução**: Restringir para `public.has_active_profile() and not public.is_viewer()`.
3. **Falta de Políticas de `DELETE` em Perfis de Operador / Admin**:
   - **Problema**: Operações de delete físico são totalmente restritas por RLS na maioria das tabelas comerciais (`clients`, `companies`, `commercial_tasks`, `projects`, `wiki_pages`, `playbooks`), bloqueando inclusive o usuário administrador/proprietário caso haja necessidade operacional urgente de purgar algum registro órfão ou duplicado.
   - **Solução**: Criar policies de `DELETE` para `public.is_admin_or_owner()` em todas as tabelas comerciais relevantes.

---

## 7. Índices recomendados

Para otimizar o desempenho do CRM, joins de chaves estrangeiras e a paginação máxima de 10 registros por página (que agora ordena as listas tradicionais por data de criação descrescente), os seguintes índices são recomendados para serem adicionados à produção:

### A. Índices de Chaves Estrangeiras Faltantes (Joins de Alta Frequência)
1. **Tabela `commercial_tasks`**:
   - `CREATE INDEX IF NOT EXISTS commercial_tasks_company_idx ON public.commercial_tasks (company_id);`
   - `CREATE INDEX IF NOT EXISTS commercial_tasks_client_idx ON public.commercial_tasks (client_id);`
   - `CREATE INDEX IF NOT EXISTS commercial_tasks_owner_idx ON public.commercial_tasks (owner_id);`
2. **Tabela `prospect_proposals`**:
   - `CREATE INDEX IF NOT EXISTS prospect_proposals_prospect_idx ON public.prospect_proposals (prospect_id);`
   - `CREATE INDEX IF NOT EXISTS prospect_proposals_created_by_idx ON public.prospect_proposals (created_by);`
3. **Tabela `tech_bugs`**:
   - `CREATE INDEX IF NOT EXISTS tech_bugs_client_idx ON public.tech_bugs (client_id);`
   - `CREATE INDEX IF NOT EXISTS tech_bugs_company_idx ON public.tech_bugs (company_id);`
4. **Tabela `tech_incidents`**:
   - `CREATE INDEX IF NOT EXISTS tech_incidents_project_idx ON public.tech_incidents (project_id);`
   - `CREATE INDEX IF NOT EXISTS tech_incidents_client_idx ON public.tech_incidents (client_id);`
5. **Tabela `tech_backlog_items`**:
   - `CREATE INDEX IF NOT EXISTS tech_backlog_items_project_idx ON public.tech_backlog_items (project_id);`
6. **Tabela `tech_roadmap_items`**:
   - `CREATE INDEX IF NOT EXISTS tech_roadmap_items_project_idx ON public.tech_roadmap_items (project_id);`
7. **Tabela `technical_decisions`**:
   - `CREATE INDEX IF NOT EXISTS technical_decisions_created_by_idx ON public.technical_decisions (created_by);`
8. **Tabela `project_notes`**:
   - `CREATE INDEX IF NOT EXISTS project_notes_author_idx ON public.project_notes (author_id);`
9. **Tabela `outreach_batches`**:
   - `CREATE INDEX IF NOT EXISTS outreach_batches_created_by_idx ON public.outreach_batches (created_by);`

### B. Índices de Ordenação e Paginação (Filtro `created_at desc`)
Devido à paginação volumosa nas listagens em produção, índices compostos e ordenados são fundamentais para evitar sequentials scans demorados:
1. **Tabela `prospects`**: `CREATE INDEX IF NOT EXISTS prospects_created_at_desc_idx ON public.prospects (created_at DESC);`
2. **Tabela `clients`**: `CREATE INDEX IF NOT EXISTS clients_created_at_desc_idx ON public.clients (created_at DESC);`
3. **Tabela `companies`**: `CREATE INDEX IF NOT EXISTS companies_created_at_desc_idx ON public.companies (created_at DESC);`
4. **Tabela `projects`**: `CREATE INDEX IF NOT EXISTS projects_created_at_desc_idx ON public.projects (created_at DESC);`
5. **Tabela `commercial_tasks`**: `CREATE INDEX IF NOT EXISTS commercial_tasks_created_at_desc_idx ON public.commercial_tasks (created_at DESC);`
6. **Tabela `files`**: `CREATE INDEX IF NOT EXISTS files_created_at_desc_idx ON public.files (created_at DESC) WHERE removed_at IS NULL;`
7. **Tabela `wiki_pages`**: `CREATE INDEX IF NOT EXISTS wiki_pages_created_at_desc_idx ON public.wiki_pages (created_at DESC);`
8. **Tabela `playbooks`**: `CREATE INDEX IF NOT EXISTS playbooks_created_at_desc_idx ON public.playbooks (created_at DESC);`
9. **Tabela `outreach_batches`**: `CREATE INDEX IF NOT EXISTS outreach_batches_created_at_desc_idx ON public.outreach_batches (created_at DESC);`
10. **Tabela `webhook_audit_logs`**: `CREATE INDEX IF NOT EXISTS webhook_audit_logs_created_at_desc_idx ON public.webhook_audit_logs (created_at DESC);`

---

## 8. Constraints e foreign keys recomendadas

As tabelas de migração estão com as restrições referenciais muito sólidas. No entanto, há duas melhorias úteis de integridade comercial e técnica:

1. **Validação da integridade de batch em `prospect_outreach`**:
   - A coluna `metadata` de `prospect_outreach` armazena o `batch_id` de forma estruturada. Uma coluna do tipo `text` referenciando `outreach_batches(batch_id)` (como chave estrangeira física) aumentaria a resiliência estrutural das prospecções em lote no lugar de salvar este mapeamento de lote puramente em JSON livre.
2. **`check` constraint robusto na tabela `prospect_proposals`**:
   - Adicionar uma constraint de verificação no valor mínimo da proposta comercial, impedindo o salvamento de propostas negativas:
     `ALTER TABLE public.prospect_proposals ADD CONSTRAINT check_positive_value CHECK (value >= 0);`
3. **Check Constraint nos status de `prospect_proposals`**:
   - Como os status aceitos no código são `'draft'`, `'sent'`, `'accepted'`, `'rejected'`, `'cancelled'`, seria seguro travar estes status no Postgres:
     `ALTER TABLE public.prospect_proposals ADD CONSTRAINT check_proposal_status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled'));`

---

## 9. Storage/buckets

O código Next.js em [actions.ts](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/app-next/src/features/knowledge/actions.ts) referencia e realiza operações de upload no bucket `"alienxip-files"`. 

Abaixo, descrevemos as políticas e migrações necessárias para o ecossistema de Storage do Supabase funcionar corretamente:

### A. Criação do Bucket
Adicionar à migração a criação do bucket:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('alienxip-files', 'alienxip-files', true)
ON CONFLICT (id) DO NOTHING;
```

### B. Políticas de Segurança RLS recomendadas em `storage.objects`

1. **Upload de Arquivos (INSERT)**:
   Apenas usuários autenticados com perfis ativos e não viewers podem enviar arquivos para o bucket `alienxip-files`:
   ```sql
   CREATE POLICY "Permitir upload para usuarios ativos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'alienxip-files' 
     AND public.has_active_profile() 
     AND NOT public.is_viewer()
   );
   ```

2. **Leitura de Arquivos (SELECT)**:
   Todos os usuários autenticados podem ver os arquivos deste bucket público:
   ```sql
   CREATE POLICY "Permitir leitura de arquivos para autenticados"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'alienxip-files');
   ```

3. **Exclusão de Arquivos (DELETE)**:
   Apenas o próprio usuário que realizou o upload do arquivo, operadores SDR/CRM ou o administrador do sistema podem excluir arquivos fisicamente no storage:
   ```sql
   CREATE POLICY "Permitir exclusao por operador ou uploader"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'alienxip-files'
     AND (
       owner = auth.uid()
       OR public.has_app_role('operator')
       OR public.is_admin_or_owner()
     )
   );
   ```

---

## 10. Triggers e activity log

O sistema adota uma abordagem híbrida de auditoria/log de atividades:
* **No código (Server Actions)**: Registra logs de forma explícita invocando `recordActivity(supabase, { ... })` e inserindo metadados manuais em `activities` e nas tabelas locais `prospect_activities`/`project_activities`.
* **Triggers de Atualização do Banco**: Executa a função `public.set_updated_at()` em 19 tabelas antes de cada operação de `UPDATE`.

### Avaliação do Padrão Adotado
O registro de atividades comerciais feito diretamente pelo código Next.js é **útil e adequado** porque:
1. Permite capturar descrições textuais ricas, contextuais e dinâmicas (ex: *"Lead enviado para automação de outreach n8n no lote [batch-xxxx]"*).
2. Permite anexar payloads complexos de metadados JSON do Next.js sem onerar a carga de CPU do banco de dados PostgreSQL.
3. Não bloqueia migrações ou esquemas quando novos fluxos de log são concebidos.

**Recomendação técnico-arquitetural**: Manter o registro no nível do código de aplicação para logs de experiência do usuário. No entanto, para fins de segurança estrita em auditorias corporativas, deveríamos ter triggers nativos de base de dados para registrar alterações brutas em colunas críticas (como mudança do status comercial de prospects e alteração de proprietário de contas).

---

## 11. Migrations recomendadas

Lista de migrations ordenadas sugeridas para corrigir os gaps encontrados de forma segura:

### 1. `20260623000001_storage_alienxip_files_bucket.sql`
* Cria o bucket de storage `alienxip-files` nas tabelas do sistema de storage do Supabase.
* Habilita políticas de SELECT, INSERT e DELETE em `storage.objects` conforme detalhado na Seção 9.

### 2. `20260623000002_harden_rls_proposals_dead_letters.sql`
* Altera as políticas de `prospect_proposals` para checar `public.has_active_profile() and not public.is_viewer()`.
* Executa `ALTER TABLE public.outreach_dead_letters ENABLE ROW LEVEL SECURITY;` e cria policy para leitura e gravação exclusivas para o perfil `service_role`.

### 3. `20260623000003_add_performance_and_sorting_indexes.sql`
* Insere todos os índices de joins faltantes identificados na Seção 7-A.
* Insere índices de ordenação `created_at desc` identificados na Seção 7-B para as listagens paginadas tradicionais.

---

## 12. Riscos

| Risco | Severidade | Impacto | Mitigação Recomendada |
|---|---|---|---|
| **Bloqueio de escrita temporário (Locks)** | Médio | Criar índices em tabelas de produção com milhões de registros pode travar operações concorrentes de INSERT/UPDATE. | Usar a instrução `CREATE INDEX CONCURRENTLY` na migration em produção. Como as tabelas em desenvolvimento ainda estão pequenas, o bloqueio tradicional nas migrations iniciais é insignificante. |
| **Quebra de Permissões de Proposta Comercial** | Alto | Usuários com permissão antiga ou integrações legadas sem o perfil completo no Supabase podem começar a receber `403 Forbidden` ao criar propostas após a restrição da policy. | Garantir que a suite de testes rode simulando o comportamento de perfis operacionais e assegurar que as integrações externas usem `service_role` ou profiles ativos. |
| **Erros de Upload no Storage** | Baixo | Erros ao subir imagens caso as permissões na pasta `storage.objects` contenham erros de syntax. | Testar minuciosamente em ambiente de desenvolvimento (local) os fluxos com buckets antes do deploy oficial. |

---

## 13. Ordem segura de execução

Caso o banco de dados seja zerado ou as alterações precisem ser submetidas, aplique as modificações exatamente após as migrations existentes da seguinte forma:

1. `20260613090000_sprint_21_outreach_dead_letters.sql` *(Migration existente)*
2. `20260623000001_storage_alienxip_files_bucket.sql` *(Nova: Storage)*
3. `20260623000002_harden_rls_proposals_dead_letters.sql` *(Nova: Segurança RLS)*
4. `20260623000003_add_performance_and_sorting_indexes.sql` *(Nova: Índices)*

Esta ordem garante que as tabelas necessárias de outreach e storage já existam antes da criação de índices e da alteração de segurança RLS nas mesmas.

---

## 14. Validação recomendada

Após criar as migrations acima e atualizar as definições de tipo, execute os comandos listados na sequência exata para certificar a integridade técnica da aplicação:

1. **Geração e sincronização de tipos**:
   `npx supabase gen types typescript --local > app-next/src/types/database.ts`
   *(Garante a inclusão de `outreach_batches` e `outreach_dead_letters` no compilador).*
2. **Diferencial e push local**:
   - `npx supabase db diff` *(Valida se o schema local está 100% alinhado com as migrations).*
   - `npx supabase db push` *(Aplica de fato as migrações na instância local).*
3. **Checagem de linting e tipos**:
   - `npm run lint` *(Garante que as ações e apis não violam padrões de formatação).*
   - `node node_modules/typescript/bin/tsc --noEmit` *(Garante que a compilação estática com os novos tipos da base de dados está perfeita).*
4. **Build e Testes**:
   - `npm run build` *(Verifica a compilação do Next.js de ponta a ponta).*
   - `npm run test` *(Valida que a navegação do sistema e fluxos de tela continuam aprovados).*
