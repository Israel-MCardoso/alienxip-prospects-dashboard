# Sprint 02 Supabase Auth Prospects Report

## Objetivo

Criar a base real de Supabase dev, autenticacao, banco inicial, RLS e CRM editavel de prospects sem substituir o dashboard legado.

## Branch e Checkpoint

- Branch criada: `sprint/02-supabase-auth-prospects`
- Checkpoint antes da Sprint 2: commit `a59ca14` (`chore: checkpoint recovery and sprint 1 foundation`)

## O Que Foi Criado

### Dependencias

Instaladas em `/app-next`:

- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

### Supabase Clients

Criados:

- `app-next/src/lib/supabase/config.ts`
- `app-next/src/lib/supabase/browser.ts`
- `app-next/src/lib/supabase/server.ts`
- `app-next/src/types/database.ts`

O client browser usa apenas URL e anon key publicas. Nenhuma service role key foi usada no frontend.

### Auth

Criado:

- `/os/login`
- `app-next/src/features/auth/login-form.tsx`

Protecao criada via route group:

- `app-next/src/app/os/(protected)/layout.tsx`

Comportamento:

- Se Supabase estiver configurado e nao houver usuario autenticado, redireciona para `/os/login`.
- Se Supabase nao estiver configurado, a app mostra fallback seguro para permitir build/dev sem credenciais reais.

### CRM de Prospects

Criados:

- `app-next/src/features/prospects/data.ts`
- `app-next/src/features/prospects/actions.ts`
- `app-next/src/features/prospects/prospect-schema.ts`
- `app-next/src/features/prospects/prospect-form.tsx`
- `app-next/src/features/prospects/prospects-crm.tsx`
- `/os/prospects`
- `/os/prospects/[id]/edit`

Funcionalidades:

- Listagem de prospects via Supabase.
- Estado vazio.
- Erro/configuracao pendente tratado.
- Formulario basico de criacao.
- Formulario basico de edicao.

Campos do formulario:

- nome
- status
- temperatura
- segmento
- cidade
- estado
- Instagram
- site
- WhatsApp
- parceiro
- observacoes

### Importador

Criado:

- `scripts/import-prospects.mjs`
- comando `npm run import:prospects`

O importador:

- Le `GOOGLE_SHEET_CSV_URL`.
- Usa `parseCsv` e `buildProspectImportRows`.
- Usa REST API do Supabase com `SUPABASE_SERVICE_ROLE_KEY` somente em Node local.
- Faz upsert por `imported_from, external_source_id`.
- Registra atividades `imported`.

### Testes

Atualizado:

- `tests/prospects.test.mjs`

Cobertura adicionada:

- importador gera `external_source_id` estavel.
- importador deduplica linhas repetidas.
- prioridades atuais viram temperaturas validas (`cold`, `warm`, `hot`).

## Migrations Criadas

Criada:

```text
supabase/migrations/20260608235900_sprint_02_prospects_core.sql
```

Tabelas:

- `profiles`
- `prospects`
- `prospect_diagnostics`
- `prospect_notes`
- `prospect_activities`

Enums:

- `app_role`
- `prospect_status`
- `prospect_temperature`
- `prospect_source`
- `prospect_note_type`
- `prospect_activity_type`

Trigger:

- `set_updated_at()`

Indices:

- status, temperatura, responsavel, cidade/estado.
- unique parcial para `imported_from, external_source_id`.
- indices para notas, diagnosticos e atividades.

## Politicas RLS

RLS habilitado em:

- `profiles`
- `prospects`
- `prospect_diagnostics`
- `prospect_notes`
- `prospect_activities`

Politicas:

- Usuarios autenticados podem ler prospects.
- Usuarios autenticados podem criar prospects.
- Usuarios autenticados podem atualizar prospects.
- Apenas `admin` ou `owner` podem deletar prospects.
- Usuarios autenticados podem ler/criar/atualizar diagnostics e notes.
- Usuarios autenticados podem ler/criar activities.
- Anonimos nao recebem policy.

Funcoes auxiliares:

- `current_user_role()`
- `is_admin_or_owner()`

## Variaveis de Ambiente

Atualizado:

- `.env.example`

Variaveis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SHEET_CSV_URL`
- `PORT`

## Auditoria de Vulnerabilidades

Comando executado:

```bash
npm audit
```

Achado:

- 2 vulnerabilidades moderadas via `postcss <8.5.10` dentro de `next`.

Decisao:

- Nao corrigido automaticamente porque `npm audit fix --force` sugere downgrade quebrando para `next@9.3.3`.
- Recomendado acompanhar patch upstream do Next ou revisar quando houver versao segura sem downgrade.

## Como Configurar Supabase Dev

Ver:

```text
docs/SUPABASE_SETUP.md
```

Resumo:

1. Criar projeto Supabase dev.
2. Copiar URL, anon key e service role para `.env.local`.
3. Aplicar migration SQL.
4. Criar usuario de teste.
5. Inserir linha correspondente em `profiles`.

## Como Rodar

Legado:

```bash
npm run dev:legacy
```

ALIENXIP OS:

```bash
npm run dev
```

Importador:

```bash
npm run import:prospects
```

Testes e build:

```bash
npm test
npm run lint
npm run build
```

## Riscos

- Supabase real nao foi executado nesta maquina por falta de credenciais reais.
- Policies RLS precisam ser validadas em um projeto Supabase dev.
- Cadastro/convite de usuarios ainda depende do painel Supabase.
- O importador usa service role local; deve ser mantido fora do frontend.
- A tela de prospects e inicial e ainda nao cobre diagnosticos/notas/atividades na UI.
- `npm audit` segue com 2 moderadas por dependencia transitiva do Next.

## Pendencias

1. Aplicar migration no Supabase dev.
2. Criar usuario interno e profile.
3. Rodar `npm run import:prospects` com credenciais reais.
4. Validar RLS com usuario autenticado e anonimo.
5. Criar UI para diagnostics, notes e activities.
6. Adicionar logout visivel.
7. Gerar tipos oficiais com Supabase CLI quando o projeto dev estiver disponivel.

## Recomendacao para Sprint 3

Evoluir o CRM de prospects:

1. Adicionar notas e diagnosticos na UI.
2. Criar timeline de atividades por prospect.
3. Adicionar logout e perfil do usuario.
4. Criar filtros reais por status, temperatura e origem.
5. Implementar conversao de prospect para company/client.
6. Adicionar testes de RLS em ambiente Supabase dev.
