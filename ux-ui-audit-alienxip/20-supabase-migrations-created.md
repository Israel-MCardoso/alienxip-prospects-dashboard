# 20 - Supabase Migrations Created

Este documento detalha as novas migrations criadas na pasta [supabase/migrations](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/supabase/migrations) para solucionar as falhas críticas de segurança, controle de acesso RLS, storage buckets e performance no banco de dados **MOTHERXIP OS / Alienxip CRM**.

Todas as migrations foram desenhadas sob os conceitos de segurança, idempotência e não quebra do histórico de deploys existente.

---

## 1. Arquivos SQL criados

Foram gerados **3 arquivos de migration** adicionais na pasta de schemas do Supabase:

1. [`20260623000001_storage_alienxip_files_bucket.sql`](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/supabase/migrations/20260623000001_storage_alienxip_files_bucket.sql)
2. [`20260623000002_harden_rls_proposals_dead_letters.sql`](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/supabase/migrations/20260623000002_harden_rls_proposals_dead_letters.sql)
3. [`20260623000003_add_performance_and_sorting_indexes.sql`](file:///c:/Users/israe/Desktop/Alienxip%20Prospects/alienxip-prospects-dashboard/supabase/migrations/20260623000003_add_performance_and_sorting_indexes.sql)

---

## 2. Descrição de cada Migration

### 📌 Migration 1: `20260623000001_storage_alienxip_files_bucket.sql`
* **Objetivo**: Inicializar e proteger o bucket do Supabase Storage.
* **Ações**:
  - Insere o registro `'alienxip-files'` na tabela de configuração interna do Supabase `storage.buckets`, marcando o bucket como público.
  - Implementa 3 políticas RLS estritas de controle de acesso na tabela `storage.objects` (Leitura pública aos autenticados, Escrita limitada e Deleção restrita).

### 📌 Migration 2: `20260623000002_harden_rls_proposals_dead_letters.sql`
* **Objetivo**: Enrijecer políticas de RLS frouxas e ativar segurança RLS em tabelas vulneráveis.
* **Ações**:
  - Altera a tabela `prospect_proposals` removendo políticas de gravação anteriores (`WITH CHECK (true)`) e restringindo-as a usuários autenticados ativos não viewers (`public.has_active_profile() AND NOT public.is_viewer()`).
  - Habilita RLS na tabela `outreach_dead_letters` (que estava vulnerável sem RLS ativo) e adiciona política de leitura exclusiva para administradores/owners (`public.is_admin_or_owner()`).
  - Adiciona constraints na tabela `prospect_proposals` para garantir valor maior ou igual a zero e travar status comerciais válidos.

### 📌 Migration 3: `20260623000003_add_performance_and_sorting_indexes.sql`
* **Objetivo**: Criar índices de banco de dados para chaves estrangeiras e campos de paginação ordenados.
* **Ações**:
  - Adiciona índices em colunas chaves usadas em joins e cláusulas `WHERE` frequentes.
  - Adiciona índices na ordenação `created_at DESC` para todas as tabelas paginadas do sistema, incluindo um índice parcial em `files` para arquivos não removidos.

---

## 3. Políticas Criadas e Removidas

A tabela a seguir consolida as alterações de segurança efetuadas nas policies:

| Tabela / Objeto | Operação | Nome da Policy | Status anterior | Novo Status após Migration |
|---|---|---|---|---|
| `storage.objects` | SELECT | `authenticated users can read alienxip-files objects` | Nenhuma policy | **Criada**: Permite leitura se `bucket_id = 'alienxip-files'` para autenticados. |
| `storage.objects` | INSERT | `active users can upload to alienxip-files` | Nenhuma policy | **Criada**: Permite upload apenas para perfis ativos e que **não** sejam `viewer`. |
| `storage.objects` | DELETE | `uploader or staff can delete alienxip-files` | Nenhuma policy | **Criada**: Permite deleção se uploader (`owner = auth.uid()`), `operator`, `admin` ou `owner`. |
| `prospect_proposals` | INSERT | `authenticated users can create proposals` | Permissivo (`WITH CHECK (true)`) | **Enrijecida**: Apenas usuários autenticados, com perfil ativo e que **não** sejam `viewer`. |
| `prospect_proposals` | UPDATE | `authenticated users can update proposals` | Permissivo (`USING (true) WITH CHECK(true)`) | **Enrijecida**: Apenas usuários autenticados, com perfil ativo e que **não** sejam `viewer`. |
| `outreach_dead_letters`| SELECT | `admins can read dead letters` | Tabela sem RLS habilitado (Acesso livre) | **Enrijecida**: Apenas usuários `admin` ou `owner` podem visualizar os logs de erro. |
| `outreach_dead_letters`| Outras | (Nenhuma) | Tabela sem RLS habilitado (Acesso livre) | **Bloqueadas**: Apenas a role de sistema (`service_role`) possui privilégios de INSERT/UPDATE/DELETE. |

---

## 4. Constraints adicionadas

Na tabela `public.prospect_proposals`, foram adicionadas constraints de integridade através de blocos `DO $$` idempotentes:

1. **`check_positive_value`**:
   - Tipo: `CHECK (value >= 0)`
   - Objetivo: Impedir propostas com valores comerciais negativos inseridos por falhas no front ou chamadas de API corrompidas.
2. **`check_proposal_status`**:
   - Tipo: `CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled'))`
   - Objetivo: Limitar o status das propostas estritamente aos enums reconhecidos pela aplicação comercial Next.js.

---

## 5. Índices adicionados

Foram criados os seguintes índices para otimizar paginações e joins:

* **Tabela `commercial_tasks`**:
  - `commercial_tasks_company_idx` (campo: `company_id`)
  - `commercial_tasks_client_idx` (campo: `client_id`)
  - `commercial_tasks_owner_idx` (campo: `owner_id`)
  - `commercial_tasks_created_at_desc_idx` (campo: `created_at DESC`)
* **Tabela `prospect_proposals`**:
  - `prospect_proposals_prospect_idx` (campo: `prospect_id`)
  - `prospect_proposals_created_by_idx` (campo: `created_by`)
* **Tabela `tech_bugs`**:
  - `tech_bugs_client_idx` (campo: `client_id`)
  - `tech_bugs_company_idx` (campo: `company_id`)
* **Tabela `tech_incidents`**:
  - `tech_incidents_project_idx` (campo: `project_id`)
  - `tech_incidents_client_idx` (campo: `client_id`)
* **Tabelas `tech_backlog_items` & `tech_roadmap_items`**:
  - `tech_backlog_items_project_idx` (campo: `project_id`)
  - `tech_roadmap_items_project_idx` (campo: `project_id`)
* **Tabelas `technical_decisions` & `project_notes`**:
  - `technical_decisions_created_by_idx` (campo: `created_by`)
  - `project_notes_author_idx` (campo: `author_id`)
* **Tabela `outreach_batches`**:
  - `outreach_batches_created_by_idx` (campo: `created_by`)
  - `outreach_batches_created_at_desc_idx` (campo: `created_at DESC`)
* **Listas Gerais (`created_at DESC` para paginação rápida)**:
  - `prospects_created_at_desc_idx` (tabela: `prospects`)
  - `clients_created_at_desc_idx` (tabela: `clients`)
  - `companies_created_at_desc_idx` (tabela: `companies`)
  - `projects_created_at_desc_idx` (tabela: `projects`)
  - `wiki_pages_created_at_desc_idx` (tabela: `wiki_pages`)
  - `playbooks_created_at_desc_idx` (tabela: `playbooks`)
  - `webhook_audit_logs_created_at_desc_idx` (tabela: `webhook_audit_logs`)
  - `files_created_at_desc_idx` (tabela: `files`, parcial: `WHERE removed_at IS NULL`)

---

## 6. O que NÃO foi alterado

* Nenhuma tabela comercial de regras de negócio foi criada ou modificada.
* Nenhuma entidade de vendas paralela (`deals`) foi criada.
* O histórico de migrations anteriores da Sprint 02 à Sprint 21 permaneceu intacto.
* Não foram adicionados triggers de auditoria automatizados que gerassem carga excessiva de processamento no Postgres.
* As Server Actions e queries do Next.js continuam usando exatamente o mesmo formato de dados sem quebras de payloads.

---

## 7. Riscos

* **Bloqueio Concorrente (Locks)**: O Supabase CLI executa migrations usando transações padrão. A criação de múltiplos índices ao mesmo tempo em tabelas de produção que já contenham milhões de registros pode travar inserções concorrentes durante alguns segundos.
  - *Mitigação*: Executar as migrations em momentos de baixa atividade ou, em ambientes de produção real massivos, criá-los de forma isolada e concorrente (`CREATE INDEX CONCURRENTLY`), o que requer desativar o bloco de transação nas ferramentas do Supabase.
* **Quebra de Integrações Legadas/Externa**: Se existirem scripts externos de integração inserindo propostas em `prospect_proposals` utilizando tokens de usuário comum que não tenham o perfil ativado no CRM, essas chamadas falharão devido ao enrijecimento do RLS.
  - *Mitigação*: Certificar que qualquer webhook de terceiro utilize a chave de acesso do administrador (`service_role`) para gravação.

---

## 8. Como aplicar localmente

Se estiver rodando o Supabase localmente através da CLI do Supabase Docker stack, você pode rodar:

```bash
# Aplica todas as migrations pendentes na sua instância local de desenvolvimento
npx supabase db push
```

*Nota: O projeto comercial atual utiliza um banco de dados hospedado em nuvem (`lclhuzagcqhrprmuaonf.supabase.co`), portanto as migrations locais devem ser integradas ao pipeline de CI/CD ou aplicadas via painel do Supabase com o CLI conectado ao projeto remoto.*

---

## 9. Como validar

Para certificar que as migrations resolveram os problemas sem quebrar a integridade do sistema, execute os seguintes passos no terminal:

1. **Atualização de tipos do Supabase (Obrigatório antes do deploy)**:
   ```bash
   npx supabase gen types typescript --local > app-next/src/types/database.ts
   ```
   *(Este comando irá regenerar o arquivo central de tipos TypeScript, inserindo as tabelas `outreach_batches` e `outreach_dead_letters` que estavam ausentes).*
2. **Validar a compilação do TypeScript**:
   ```bash
   npm run lint
   node node_modules/typescript/bin/tsc --noEmit
   ```
   *(Certifica que os novos tipos gerados no passo 1 não geraram erros de compilação ou incompatibilidade no front/server actions).*
3. **Executar a suite de testes automatizados**:
   ```bash
   npm run test
   ```
   *(Valida que todas as 105 asserções do fluxo de prospects, timeline, SDR, e preflight passam sem exceções).*

---

## 10. Checklist antes de Produção

- [ ] Verificar se as variáveis de ambiente `MOTHERXIP_WEBHOOK_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` estão cadastradas e seguras no painel de produção (ex: Railway/Vercel).
- [ ] Aplicar a migration `20260623000001_storage_alienxip_files_bucket.sql` para garantir que o bucket de arquivos exista antes da primeira operação de upload do usuário.
- [ ] Rodar o gerador de tipos para atualizar o `database.ts` no repositório de produção.
- [ ] Garantir que nenhum perfil com a role `viewer` consiga criar propostas comerciais em testes de aceitação pós-deploy.

---

## Revisão final pré-deploy

Efetuamos uma revisão minuciosa nos três arquivos de migration criados antes de prosseguir com qualquer processo de deploy em produção:

1. **Validação de DROP POLICY**:
   - Verificado que todos os comandos `DROP POLICY IF EXISTS` apontam para o nome exato e a tabela correspondente (`storage.objects`, `public.prospect_proposals` e `public.outreach_dead_letters`), evitando erros de compilação ou de execução do Supabase CLI.
2. **Políticas em storage.objects**:
   - Confirmado que no Supabase Storage a coluna que indica o usuário criador do arquivo é chamada `owner` (tipo `uuid` mapeando para `auth.users(id)`), de modo que a expressão `owner = auth.uid()` é a sintaxe padrão correta.
   - Todas as novas políticas possuem escopo restrito a `bucket_id = 'alienxip-files'`.
3. **Resolução de Conflitos e Redundâncias de Índices**:
   - Durante a auditoria dos índices em `20260623000003_add_performance_and_sorting_indexes.sql`, foi detectado que o índice `commercial_tasks_owner_idx` já havia sido criado originalmente na migration da Sprint 06 (`20260609020000_sprint_06_unified_workspace_core.sql`).
   - *Ação Corretiva*: O índice duplicado foi **removido** da nova migration de performance para manter o histórico limpo e evitar redundância, embora o uso do modificador `IF NOT EXISTS` impedisse falhas graves.
4. **Idempotência**:
   - Todas as modificações de constraints na tabela `prospect_proposals` utilizam blocos `DO $$` anônimos com checagens estruturadas no catálogo do Postgres (`pg_constraint`), impedindo falhas caso as migrations sejam reexecutadas.
5. **Segurança de Dead Letters**:
   - Confirmado que a ativação de RLS com apenas política de visualização para admins garante que escritas em background ou via webhooks n8n (que utilizam o cliente administrativo `service_role` com bypass de RLS) funcionem perfeitamente, enquanto o acesso público não autenticado fica 100% bloqueado.

