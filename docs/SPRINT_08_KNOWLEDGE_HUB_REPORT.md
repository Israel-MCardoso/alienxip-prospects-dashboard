# Sprint 08 - Knowledge Hub, Playbooks, Storage & Search Foundation

## Objetivo

Transformar a ALIENXIP OS em um centro de conhecimento operacional, centralizando Wiki, Playbooks, arquivos, links de conhecimento em projetos e busca ampliada.

## O que foi criado

- Wiki operacional em `/os/wiki`.
- Detalhe/edicao de Wiki em `/os/wiki/[slug]`.
- Playbooks em `/os/playbooks`.
- File Center em `/os/files`.
- Upload real para Supabase Storage no bucket `alienxip-files`.
- Metadados persistidos em `files`.
- Wiki Links em `/os/projects/[id]`.
- Playbooks relacionados e arquivos em `/os/clients/[id]`.
- Arquivos em `/os/prospects/[id]`.
- Busca global ampliada para Wiki, Playbooks e Files.
- Activity Feed registra wiki criada, wiki atualizada, wiki publicada/arquivada, playbook criado, arquivo enviado e wiki vinculada a projeto.

## Migration

Arquivo:

- `supabase/migrations/20260609030000_sprint_08_knowledge_hub_storage_search.sql`

Tabelas criadas:

- `wiki_pages`
- `playbooks`
- `project_wiki_links`

Enums criados:

- `knowledge_status`: `draft`, `published`, `archived`
- `knowledge_category`: `vendas`, `prospeccao`, `desenvolvimento`, `design`, `operacao`, `suporte`, `financeiro`, `geral`

Melhorias:

- Indices por status/categoria.
- Indices GIN com `to_tsvector('portuguese', ...)` para preparar full-text search.
- Policy adicional para update em `files`.

## Rotas

Criadas:

- `/os/wiki/[slug]`
- `/os/playbooks`
- `/os/files`

Evoluidas:

- `/os/wiki`
- `/os/projects/[id]`
- `/os/clients/[id]`
- `/os/prospects/[id]`

## Storage

Bucket recomendado:

- `alienxip-files`

Fluxo atual:

1. Usuario seleciona arquivo em Prospect, Cliente ou Projeto.
2. Server action envia arquivo para Supabase Storage.
3. Metadata e persistida na tabela `files`.
4. Activity global registra `file_uploaded`.

Observacao: o bucket precisa existir no Supabase antes do upload real.

## RLS

Wiki:

- Leitura de publicadas para autenticados.
- Drafts/arquivadas visiveis para criador/admin.
- Criacao por `created_by = auth.uid()`.
- Atualizacao por criador, updated_by ou admin.

Playbooks:

- Mesma estrategia da Wiki.

Project Wiki Links:

- Leitura autenticada.
- Criacao por `created_by = auth.uid()` ou admin.

Files:

- Leitura autenticada mantida da Sprint 07.
- Insert por `uploaded_by = auth.uid()` ou admin.
- Update por uploader ou admin.

## Testes

Arquivo:

- `tests/knowledge-hub.test.mjs`

Cobertura:

- Validacao Wiki.
- Validacao Playbook.
- Metadata de upload.
- Helper de path seguro para storage.
- Busca de conhecimento.

## Busca Global

Agora inclui:

- Wiki pages
- Playbooks
- Files
- Entidades operacionais anteriores
- Entidades tecnicas da Sprint 07

## Riscos

- Upload depende do bucket `alienxip-files` existir no Supabase.
- Ainda nao ha remocao real de arquivos nem activity `file_removed`.
- Full-text search esta preparado via indices, mas a busca da UI ainda usa dataset limitado em memoria.
- Wiki Links permitem vinculo, mas ainda nao possuem remocao/desvinculo.

## Pendencias

- Criar bucket `alienxip-files` nos ambientes.
- Implementar remocao segura de arquivo e metadata.
- Criar RPC full-text search real.
- Criar permissao por time/role para conhecimento sensivel.
- Criar templates iniciais de playbooks.
- Criar pagina de detalhe para Playbook.

## Validacao executada

Comandos:

```bash
npm test
npm run lint
npm run build
```

Resultado:

- Testes passaram.
- Lint passou.
- Build completo passou.

## Recomendacao para Sprint 09

Focar em Search, Permissions & Knowledge Quality:

1. Criar RPC `global_search` com full-text Postgres.
2. Criar templates oficiais de playbooks.
3. Criar detalhe/edicao de playbooks.
4. Criar remocao segura de arquivos com activity `file_removed`.
5. Criar permissao por papel/categoria para Wiki e Playbooks.
6. Criar relacionamento entre Playbooks e Clientes/Projetos.
7. Criar seeded content inicial para processos principais da ALIENXIP.
