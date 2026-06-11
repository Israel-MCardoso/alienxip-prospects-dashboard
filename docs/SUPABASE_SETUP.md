# Supabase Setup - ALIENXIP OS

## Objetivo

Configurar Supabase em ambiente de desenvolvimento para autenticar usuarios internos e armazenar prospects editaveis sem substituir o dashboard legado.

## Variaveis de Ambiente

Crie `.env.local` na raiz do repositorio com:

```env
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv&gid=0
PORT=3000

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Regras de seguranca:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser usados no frontend.
- `SUPABASE_SERVICE_ROLE_KEY` e somente para scripts locais/server-side.
- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em componentes React, browser client ou variaveis publicas.
- Nunca versione `.env.local`.

## Criar Projeto Supabase Dev

1. Crie um projeto Supabase separado para desenvolvimento.
2. Copie Project URL para `NEXT_PUBLIC_SUPABASE_URL`.
3. Copie anon public key para `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copie service role key para `SUPABASE_SERVICE_ROLE_KEY`.
5. Mantenha cadastro publico desabilitado se o workspace for interno.

## Aplicar Migration

Migration inicial:

```text
supabase/migrations/20260608235900_sprint_02_prospects_core.sql
```

Aplicar pelo Supabase SQL Editor:

1. Abra o SQL Editor no projeto dev.
2. Cole o conteudo da migration.
3. Execute.
4. Verifique se RLS ficou ativo nas tabelas:
   - `profiles`
   - `prospects`
   - `prospect_diagnostics`
   - `prospect_notes`
   - `prospect_activities`

## Criar Usuario de Teste

1. No painel Supabase, va em Authentication.
2. Crie um usuario com email e senha.
3. Insira um profile correspondente:

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Admin ALIENXIP', 'owner'
from auth.users
where email = 'SEU_EMAIL';
```

## Rodar Localmente

Nova ALIENXIP OS:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000/os/login
```

Dashboard legado:

```bash
npm run dev:legacy
```

Abrir:

```text
http://localhost:3000
```

Se precisar rodar ambos ao mesmo tempo:

```bash
npm run dev:legacy
npm --prefix app-next run dev -- -p 3100
```

## Importar Prospects da Google Sheet

Depois de configurar `.env.local`:

```bash
npm run import:prospects
```

O importador:

- Le `GOOGLE_SHEET_CSV_URL`.
- Usa o parser extraido na Sprint 1.
- Cria uma chave estavel em `external_source_id`.
- Faz upsert em `prospects`.
- Usa `imported_from = 'google_sheet'`.
- Registra atividade `imported` em `prospect_activities`.
- Nao duplica registros quando a mesma linha e importada novamente.

## Validacoes

```bash
npm test
npm run lint
npm run build
```

## Teste Manual de RLS

Leitura autenticada:

1. Entre em `/os/login` com um usuario criado no Supabase Auth.
2. Abra `/os/prospects`.
3. A lista deve carregar registros da tabela `prospects`.

Bloqueio anonimo:

1. Abra uma janela anonima sem login.
2. Acesse `/os/prospects`.
3. O app deve redirecionar para `/os/login` quando Supabase estiver configurado.
4. Chamadas anonimas diretas pelo Supabase REST devem falhar por ausencia de policy para `anon`.

Criacao autenticada:

1. Logado, abra `/os/prospects`.
2. Preencha o formulario de novo prospect.
3. Confirme que o registro aparece na tabela.

Limitacoes atuais:

- As policies permitem edicao ampla para usuarios autenticados durante a fase dev.
- Delete ja fica restrito a `admin`/`owner`.
- Edicao de nota propria ainda depende de refinamento futuro de policy por `author_id`.

## Troubleshooting

### Login mostra configuracao pendente

Verifique se `.env.local` existe na raiz e se as variaveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nao estao com placeholders.

### Importador falha por service role

Verifique `SUPABASE_SERVICE_ROLE_KEY`. Ela precisa ser a service role do projeto dev e nunca deve ser usada no frontend.

### RLS bloqueia dados

Confirme que o usuario autenticado tem linha correspondente em `profiles`.

### npm audit mostra vulnerabilidade moderada

O audit atual aponta `postcss` dentro de `next`. O fix automatico sugerido pelo npm faz downgrade quebrando para `next@9.3.3`, por isso nao deve ser aplicado sem revisao.
