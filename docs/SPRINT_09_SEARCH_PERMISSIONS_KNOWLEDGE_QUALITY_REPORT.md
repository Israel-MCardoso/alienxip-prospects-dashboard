# Sprint 09 - Search, Permissions & Knowledge Quality

## Objetivo

Consolidar busca global, permissões iniciais por papel, templates oficiais, remoção segura de arquivos e governança de qualidade para Wiki e Playbooks.

## O que foi criado

- RPC SQL `global_search`.
- Endpoint `/api/global-search` usado pelo Ctrl + K.
- Fallback local seguro para busca global quando RPC/Supabase nao estiver disponivel.
- Detalhe e edicao de Playbook em `/os/playbooks/[id]`.
- Publicar, arquivar e duplicar Playbook.
- Templates oficiais de conhecimento com insercao sem duplicar.
- Remocao segura de arquivos por metadata.
- Campos de review para Wiki e Playbooks.
- Filtros por review status em Wiki e Playbooks.
- Helpers de permissao `admin`, `operator`, `viewer`.

## Migration

Arquivo:

- `supabase/migrations/20260609033000_sprint_09_search_permissions_knowledge_quality.sql`

Mudancas:

- Enum `knowledge_review_status`.
- Campos em `wiki_pages`:
  - `reviewed_at`
  - `reviewed_by`
  - `review_status`
- Campos em `playbooks`:
  - `reviewed_at`
  - `reviewed_by`
  - `review_status`
- Campos em `files`:
  - `removed_at`
  - `removed_by`
  - `removal_reason`
- Adiciona role `operator` ao enum `app_role`.
- Cria função `has_app_role`.
- Cria função/RPC `global_search`.
- Refina policies de files para leitura apenas de arquivos ativos, uploader ou admin.

## RPC

Função:

- `public.global_search(search_query text, result_limit integer default 20)`

Retorna:

- `entity_type`
- `entity_id`
- `title`
- `subtitle`
- `url`
- `rank`
- `created_at`

Inclui:

- prospects
- companies
- clients
- projects
- tasks
- bugs
- incidents
- backlog
- roadmap
- technical decisions
- wiki pages
- playbooks
- files

## Permissões

Modelo documentado nos helpers:

- `admin`: tudo.
- `operator`: cria/edita prospects, tasks, projects, wiki, playbooks e files; nao deleta dados criticos.
- `viewer`: leitura.

RLS reforcado:

- `files` agora considera `removed_at`.
- Update em files permitido para uploader, operator ou admin.
- `has_app_role` prepara policies futuras por role.

## Templates oficiais

Templates criados:

- Processo de Prospecção
- Diagnóstico Digital
- Entrega Landing Page
- Onboarding Cliente
- Deploy Produção
- Postmortem de Incidente
- Criação de Projeto

Eles podem ser inseridos pela ação de seed na Wiki sem duplicar por slug.

## Rotas novas

- `/api/global-search`
- `/os/playbooks/[id]`

## Testes

Arquivo:

- `tests/search-permissions-knowledge-quality.test.mjs`

Cobertura:

- Shape de resultado de busca.
- Ranking helper.
- Permission helper.
- Duplicacao de Playbook.
- Metadata de remocao segura de arquivo.
- Review status.
- Templates oficiais.

## Riscos

- A RPC usa `security definer`; por isso deve ser revisada antes de expor dados sensiveis para usuarios externos.
- `operator` foi adicionado ao enum de roles, mas o produto ainda precisa de UI administrativa para gerenciar roles.
- Remocao de arquivo nesta sprint marca metadata; nao remove fisicamente do Storage.
- Full-text usa `plainto_tsquery('portuguese')`; pode precisar tuning para nomes proprios e termos em ingles.

## Pendencias

- UI administrativa para roles.
- Remocao fisica controlada do Storage, com fila/auditoria.
- Desduplicacao mais sofisticada para templates.
- Paginas de detalhe para resultados tecnicos individuais.
- Busca global com highlights/snippets.

## Validacao executada

```bash
npm test
npm run lint
npm run build
```

Resultado:

- Testes passaram.
- Lint passou.
- Build completo passou.

## Recomendacao para Sprint 10

Avancar para **Finance & Internal Operations Foundation**:

1. Criar modulo financeiro inicial para contratos, receitas recorrentes e status de pagamento.
2. Conectar clientes/projetos a contratos.
3. Criar dashboard financeiro interno.
4. Criar auditoria de roles e tela de administracao.
5. Criar busca com snippets e filtros por tipo.
6. Preparar camada de IA apenas para leitura assistida de Wiki/Playbooks, sem automacoes destrutivas.
