# ALIENXIP OS Architecture Plan

## 1. Visao do Produto

ALIENXIP OS sera a plataforma interna principal da ALIENXIP para operar prospeccao, CRM, clientes, projetos, tarefas, roadmap, bugs, arquivos e conhecimento interno.

O dashboard atual de prospects deve ser tratado como a primeira celula funcional do produto: ele ja resolve visualizacao e priorizacao comercial. A migracao deve preservar esse valor, adicionar autenticacao, persistencia, permissoes e modularidade, e depois expandir para os demais modulos operacionais.

Principios do produto:

- Comecar pelo fluxo que ja funciona: prospects.
- Preservar o deploy atual como fallback.
- Migrar dados sem perda e com trilha auditavel.
- Evitar uma reescrita grande sem validacao incremental.
- Construir fundacoes reutilizaveis para os proximos modulos.

## 2. Estado Atual do Projeto

Repositorio atual: `Israel-MCardoso/alienxip-prospects-dashboard`

Deploy atual: `alienxip-prospects-dashboard-vercel.vercel.app`

Arquivos principais:

- `index.html`: UI estatica, filtros, metricas, tabela e regras client-side.
- `api/prospects.js`: funcao serverless que busca Google Sheet como CSV, faz parse e retorna JSON.
- `vercel.json`: configuracao basica de headers/cache.
- `scripts/dev-server.mjs`: servidor local adicionado para desenvolvimento.

Limitacoes atuais:

- Sem autenticacao.
- Sem permissoes.
- Sem banco proprio.
- Sem edicao persistente por multiplos usuarios.
- Sem trilha de atividades.
- Sem modulos internos alem de prospects.
- Sem testes automatizados.

## 3. Partes Reaproveitaveis

### UI

Reaproveitar:

- Layout operacional denso com header fixo, filtros, metricas e tabela.
- Paleta simples e utilitaria.
- Hierarquia visual de prioridades `Alta`, `Media`, `Baixa`.
- Ideia de painel unico para leitura rapida.

Migrar para:

- Componentes React/Next.js, por exemplo `ProspectsTable`, `ProspectsFilters`, `ProspectsMetrics`, `PriorityBadge`.

Nao reaproveitar diretamente:

- Manipulacao manual de DOM via `document.getElementById`.
- HTML monolitico como base de longo prazo.

### Logica de Leitura da Planilha

Reaproveitar:

- Parser CSV inicial.
- Contrato de endpoint `/api/prospects`.
- Estrategia de importar dados da Google Sheet como origem temporaria.

Migrar para:

- Job/manual action de importacao para Supabase.
- Parser testado em modulo isolado.
- Registro de `source_row_hash` para evitar duplicacoes.

### Layout

Reaproveitar:

- Padrao de dashboard administrativo.
- Tabela ampla com scroll horizontal.
- Cards de metricas.
- Filtros por busca, prioridade e presenca de links.

Migrar para:

- Layout autenticado com sidebar, topbar e areas por modulo.
- Prospects como primeiro modulo dentro de `ALIENXIP OS`.

### Componentes Visuais

Componentes candidatos:

- Metric card.
- Filter bar.
- Data table.
- Priority badge.
- Empty/loading/error states.
- Link cell.

### Regras de Priorizacao

Reaproveitar como regra inicial:

- Contagem de avaliacoes aumenta score.
- Ausencia de site aumenta oportunidade.
- Site apenas social/linktree aumenta oportunidade moderada.
- Presenca de WhatsApp aumenta prontidao de abordagem.

Migrar para:

- Funcao de dominio `calculateProspectPriority`.
- Campos persistidos: `priority`, `score`, `score_reasons`.
- Possibilidade futura de configurar pesos sem deploy.

### Regras de Oferta

Reaproveitar como baseline:

- Oferta para presenca digital basica quando nao ha site/rede.
- Ofertas por segmentos: saude, pet, beleza, tatuagem, juridico/contabil.
- Oferta generica para diagnostico digital e automacoes.

Migrar para:

- Funcao `suggestProspectOffer`.
- Tabela futura de templates de oferta.
- Campo editavel por usuario no CRM.

### Estrutura de Dados dos Prospects

Campos atuais detectados:

- `title`
- `type`
- `types`
- `address`
- `phoneNumber`
- `rating`
- `ratingCount`
- `website`
- `bookingLinks`
- `latitude`
- `longitude`

Campos derivados atuais:

- `empresa`
- `segmento`
- `cidade`
- `prioridade`
- `avaliacao`
- `site`
- `social`
- `whatsapp`
- `oferta`
- `proximo`

## 4. Estrategia Recomendada

### Decisao: Evoluir no Mesmo Repositorio

Recomendacao: manter o mesmo repositorio e criar a nova base da ALIENXIP OS em paralelo, preservando o dashboard atual ate a substituicao estar validada.

Motivos:

- Mantem historico e contexto de recuperacao.
- Reduz risco de perder o deploy atual.
- Facilita comparar comportamento antigo e novo.
- Permite migracao incremental por rotas.
- Evita overhead inicial de dois repositorios.

Como preservar o fallback:

- Manter `index.html` e `api/prospects.js` intocados durante a primeira fase.
- Criar a nova aplicacao em uma branch ou pasta isolada antes da troca de deploy.
- Publicar preview na Vercel antes de apontar producao.
- Manter tag/release do estado atual.

Quando criar novo repositorio:

- Apenas se a ALIENXIP OS se tornar um produto separado com ciclo, equipe e permissoes de repositorio diferentes.
- Apenas depois de haver uma base funcional e validada.

## 5. Stack Recomendada

Frontend e backend:

- Next.js com App Router.
- TypeScript.
- React Server Components onde fizer sentido.
- Server Actions ou Route Handlers para operacoes internas.

UI:

- Tailwind CSS.
- shadcn/ui ou componentes proprios inspirados em design system simples.
- TanStack Table para tabelas complexas.
- React Hook Form + Zod para formularios.

Banco, auth e storage:

- Supabase Postgres.
- Supabase Auth.
- Supabase Storage.
- Row Level Security habilitado desde o inicio.

Dados e validacao:

- Zod para schemas de entrada.
- SQL migrations versionadas.
- Seed/import scripts para migrar Google Sheet.

Deploy:

- Vercel para frontend e APIs Next.js.
- Supabase para banco/auth/storage.
- Variaveis de ambiente separadas por Preview e Production.

Observabilidade minima:

- Logs de importacao.
- Tabela `activities`.
- Erros de API registrados de forma segura.

## 6. Modulos Principais

### Core

- Autenticacao.
- Perfis de usuario.
- Organizacao ALIENXIP.
- Permissoes por papel.
- Activity log.

### Prospects CRM

- Lista de prospects.
- Detalhe do prospect.
- Notas.
- Diagnosticos.
- Mensagens e abordagens.
- Status de pipeline.
- Importacao da Google Sheet.

### Companies

- Empresas externas antes de virarem clientes.
- Relacao entre prospects, companies e clientes.

### Clients

- Clientes ativos.
- Dados comerciais e operacionais.
- Historico de relacionamento.

### Projects

- Projetos por cliente.
- Status, responsaveis, prazos.
- Vinculo com tarefas, arquivos e wiki.

### Tasks e Sprints

- Backlog interno.
- Sprints.
- Responsaveis.
- Prioridade e status.

### Bugs

- Registro de problemas.
- Severidade.
- Vinculo com projeto, tarefa e sprint.

### Roadmap

- Itens estrategicos.
- Priorizacao.
- Relacao com projetos e tarefas.

### Wiki

- Paginas internas.
- Documentacao operacional.
- Relacao com projetos, clientes e processos.

### Files

- Metadados de arquivos.
- Vinculo com Supabase Storage.
- Associacao com clientes, projetos, prospects ou wiki.

## 7. Estrutura de Pastas Recomendada

Proposta para a fase Next.js:

```text
.
├── legacy/
│   ├── index.html
│   └── api/
│       └── prospects.js
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (os)/
│   │   │   ├── prospects/
│   │   │   ├── companies/
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── roadmap/
│   │   │   └── wiki/
│   │   └── api/
│   │       └── imports/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── data-table/
│   ├── features/
│   │   ├── prospects/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── wiki/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   └── csv/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed/
├── docs/
└── tests/
```

Observacao: a pasta `legacy/` deve ser criada apenas quando a migracao estrutural comecar. Nesta etapa, o dashboard atual deve permanecer onde esta.

## 8. Modelo Inicial de Banco

O modelo inicial esta detalhado em `docs/DATABASE_DRAFT.md`.

Entidades centrais:

- `profiles`
- `prospects`
- `prospect_notes`
- `prospect_diagnostics`
- `prospect_messages`
- `companies`
- `clients`
- `projects`
- `tasks`
- `sprints`
- `bugs`
- `roadmap_items`
- `wiki_pages`
- `files`
- `activities`

Convencoes:

- UUID como chave primaria.
- `created_at`, `updated_at`, `created_by`, `updated_by` nas tabelas operacionais.
- Soft delete apenas onde fizer sentido: `archived_at` ou `deleted_at`.
- Enums ou check constraints para status e prioridade.
- RLS desde a primeira migration.

## 9. Autenticacao

Recomendacao:

- Supabase Auth com email/password ou magic link no inicio.
- Desabilitar cadastro publico.
- Criar usuarios por convite/manual no painel administrativo.
- Mapear `auth.users.id` para `profiles.id`.

Fluxos:

- Login.
- Logout.
- Recuperacao de acesso.
- Perfil basico.
- Bloqueio de usuarios inativos.

## 10. Permissoes

Modelo inicial simples por papel:

- `owner`: acesso total, configuracoes, usuarios e dados.
- `admin`: acesso operacional completo sem controle de billing/secrets.
- `manager`: gerencia prospects, clientes, projetos e tarefas.
- `member`: cria/edita itens atribuidos ou liberados.
- `viewer`: somente leitura.

Estrategia:

- Papel principal em `profiles.role`.
- RLS baseada no papel.
- Funcoes SQL auxiliares para `is_owner`, `is_admin`, `can_manage_projects`.
- Evoluir para permissoes granulares apenas quando houver necessidade real.

## 11. Migracao dos Dados da Google Sheet

Fase 1: leitura dupla

- Manter `/api/prospects` atual.
- Criar script/import route separado que le CSV e grava em `prospects`.
- Comparar total de linhas, campos obrigatorios e hashes.

Fase 2: banco como fonte primaria

- Tela nova le `prospects` do Supabase.
- Google Sheet vira origem de importacao, nao fonte runtime.
- Manter endpoint legado funcionando para comparacao.

Fase 3: desativacao controlada

- Congelar importacao automatica.
- Validar uso real no banco.
- Remover dependencia de fallback apenas depois de backup e aceite.

Campos de importacao:

- `source = 'google_sheet'`
- `source_external_id`
- `source_row_hash`
- `imported_at`
- `raw_payload`

## 12. Riscos Tecnicos

- Quebrar o deploy atual ao tentar migrar tudo de uma vez.
- Perder regras de priorizacao que hoje estao embutidas no frontend.
- Duplicar prospects durante importacao.
- Expor dados internos sem autenticacao adequada.
- Criar modelo de permissoes complexo cedo demais.
- Depender indefinidamente de Google Sheet publica.
- Migrar para Next.js sem testes de paridade do dashboard.
- Misturar CRM, projetos e wiki antes de estabilizar o core.

Mitigacoes:

- Desenvolvimento em branch.
- Preview deploy antes de producao.
- Testes de parser e score.
- Importacao idempotente.
- RLS obrigatoria.
- Snapshot/backup da planilha antes da primeira carga.
- Manter dashboard legado ate validacao.

## 13. Ordem Recomendada de Implementacao

### Fase 0: Preparacao

1. Criar branch `feature/alienxip-os-foundation`.
2. Criar tag do estado atual.
3. Confirmar conexao Vercel <> GitHub.
4. Definir ambiente Supabase separado para desenvolvimento.

### Fase 1: Fundacao Tecnica

1. Introduzir Next.js + TypeScript em estrutura isolada.
2. Configurar lint, format e testes.
3. Criar layout autenticado basico.
4. Configurar variaveis de ambiente seguras.

### Fase 2: Supabase Core

1. Criar projeto Supabase.
2. Criar migrations iniciais.
3. Configurar auth.
4. Configurar profiles e roles.
5. Ativar RLS.

### Fase 3: Prospects v1

1. Migrar parser CSV para modulo testado.
2. Criar importador da Google Sheet.
3. Criar tabela `prospects`.
4. Criar tela de listagem equivalente ao dashboard atual.
5. Validar paridade de metricas, filtros e prioridades.

### Fase 4: CRM Operacional

1. Detalhe do prospect.
2. Notas.
3. Diagnosticos.
4. Mensagens.
5. Conversao para company/client.

### Fase 5: Projetos e Execucao

1. Clients.
2. Projects.
3. Tasks.
4. Sprints.
5. Bugs.

### Fase 6: Conhecimento e Roadmap

1. Roadmap.
2. Wiki.
3. Files.
4. Activities globais.

## 14. Proxima Sprint Recomendada

Objetivo da sprint: preparar a fundacao sem substituir o dashboard atual.

Entregas:

- Branch de fundacao criada.
- Next.js + TypeScript inicial configurado em paralelo.
- Supabase documentado e variaveis preparadas, sem conectar producao.
- Modelagem SQL inicial revisada.
- Testes do parser CSV e regras de prioridade.
- Tela inicial autenticada placeholder, sem trocar deploy principal.

Definition of Done:

- Dashboard atual continua acessivel.
- Build legado continua passando.
- Nova base roda localmente em ambiente separado.
- Nenhum segredo versionado.
- Plano de rollback documentado.
