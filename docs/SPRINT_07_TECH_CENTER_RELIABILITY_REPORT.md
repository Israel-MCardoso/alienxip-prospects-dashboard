# Sprint 07 - Tech Center & Operational Reliability

## Objetivo

Criar o Tech Center da ALIENXIP OS e reforcar confiabilidade operacional com bugs, incidentes, backlog tecnico, roadmap tecnico, decisoes arquiteturais, notas persistentes de projeto, base de arquivos, RLS granular e busca global ampliada.

## O que foi criado

- Tech Center em `/os/tech`.
- Area de bugs em `/os/tech/bugs`.
- Area de incidentes em `/os/tech/incidents`.
- Area de backlog tecnico em `/os/tech/backlog`.
- Area de roadmap tecnico em `/os/tech/roadmap`.
- Area de decisoes tecnicas/ADR em `/os/tech/decisions`.
- Notas persistentes de projeto em `/os/projects/[id]`.
- Base de arquivos com tabela `files` e componente de listagem para projeto, cliente e prospect.
- Busca global ampliada para entidades tecnicas.
- Registro de activities globais para criacao de bugs, incidentes, backlog, roadmap, decisoes e notas de projeto.

## Migration

Arquivo:

- `supabase/migrations/20260609023000_sprint_07_tech_center_reliability.sql`

Tabelas criadas:

- `tech_bugs`
- `tech_incidents`
- `tech_backlog_items`
- `tech_roadmap_items`
- `technical_decisions`
- `project_notes`
- `files`

Enums criados:

- `tech_bug_status`
- `tech_incident_status`
- `tech_severity`
- `tech_priority`
- `tech_backlog_type`
- `tech_backlog_status`
- `tech_roadmap_status`
- `technical_decision_status`
- `project_note_type`

Bucket recomendado:

- `alienxip-files`

Observacao: a migration prepara a tabela de metadados de arquivos. A criacao do bucket no Supabase Storage deve ser feita no painel/CLI do Supabase antes do upload real.

## Rotas

Criadas:

- `/os/tech/bugs`
- `/os/tech/incidents`
- `/os/tech/backlog`
- `/os/tech/roadmap`
- `/os/tech/decisions`

Evoluida:

- `/os/tech`
- `/os/projects/[id]`
- `/os/clients/[id]`
- `/os/prospects/[id]`

## Politicas RLS

Modelo aplicado:

- Leitura: usuarios autenticados podem ler registros tecnicos operacionais.
- Criacao: usuario autenticado precisa ser `created_by`, `reported_by`, `author_id`, `uploaded_by`, `owner_id` ou admin conforme a tabela.
- Atualizacao:
  - Bugs: `assigned_to`, `reported_by` ou admin.
  - Incidentes: `owner_id`, `created_by` ou admin.
  - Backlog/Roadmap: `owner_id`, `created_by` ou admin.
  - Technical decisions: `created_by` ou admin.
  - Project notes: `author_id` ou admin.
- Delete amplo nao foi criado nesta sprint.

## Testes

Arquivo:

- `tests/tech-center.test.mjs`

Cobertura:

- Validacao de bug.
- Validacao de incidente.
- Validacao de backlog.
- Validacao de decisao tecnica.
- Validacao de project note.
- Helper de severidade/prioridade.
- Helper de busca tecnica.
- Regras RLS documentadas.

## Busca global

A busca global agora inclui:

- bugs
- incidentes
- backlog tecnico
- roadmap tecnico
- decisoes tecnicas
- project notes

Ainda e uma busca em memoria a partir de dataset limitado. A proxima evolucao recomendada e uma RPC/view com full-text search no Postgres.

## Riscos

- A migration cria enums sem `if not exists`; deve ser aplicada uma unica vez pelo mecanismo normal de migrations.
- Upload real de arquivos ainda nao foi implementado; apenas a base de metadados e placeholders funcionais.
- Activities tecnicas usam o feed global, mas algumas entidades aparecem como tipo operacional generico ate a proxima normalizacao de entity types.
- RLS esta mais granular, mas ainda permite leitura autenticada ampla para manter operacao interna simples.

## Pendencias

- Criar upload real para Supabase Storage.
- Criar bucket `alienxip-files` no ambiente Supabase.
- Criar paginas de detalhe para bug/incidente/backlog/roadmap/decisao.
- Criar edicao completa dos registros tecnicos.
- Melhorar global search com full-text search/RPC.
- Normalizar `entity_type` do feed global para tipos tecnicos dedicados.
- Criar runbooks e checklist de incident response.

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
- Build completo passou, incluindo legado e Next.

## Recomendacao para Sprint 08

Priorizar Storage, permissao e detalhe operacional:

1. Implementar upload real com Supabase Storage no bucket `alienxip-files`.
2. Criar paginas de detalhe para bugs e incidentes.
3. Criar workflow de incident response com status, timeline e postmortem.
4. Criar busca Postgres full-text com RPC para entidades operacionais e tecnicas.
5. Criar auditoria de activities por trigger/function para reduzir risco de actions sem registro.
6. Refinar RLS para leitura por owner/team quando a ALIENXIP OS tiver times internos definidos.
