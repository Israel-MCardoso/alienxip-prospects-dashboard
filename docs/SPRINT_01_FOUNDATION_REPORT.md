# Sprint 01 Foundation Report

## Objetivo

Criar a fundacao tecnica da ALIENXIP OS em paralelo ao dashboard legado, sem remover `index.html`, sem remover `/api/prospects`, sem conectar Supabase em producao e sem alterar o design atual do dashboard.

## Checkpoints Criados

- Branch criada: `sprint/01-foundation-alienxip-os`
- Tag criada: `recovery-stable-v1`

Observacao: a tag aponta para o commit Git estavel existente antes da Sprint 1. O working tree ja continha arquivos de recuperacao/documentacao nao commitados da etapa anterior, que foram preservados na nova branch.

## Decisao Estrutural

A base Next.js foi criada em `/app-next`.

Motivo:

- Menor risco para o dashboard atual.
- Evita sobrescrever `index.html`, `api/prospects.js` e `vercel.json`.
- Permite rodar o legado e a ALIENXIP OS lado a lado.
- Permite preview deploy futuro antes de qualquer troca de producao.

## O Que Foi Criado

### Nova base Next.js

- `app-next/`
- Next.js 16.2.7
- React 19.2.4
- TypeScript
- Tailwind CSS v4
- ESLint
- shadcn/ui com componentes minimos:
  - `button`
  - `card`
  - `badge`
  - `input`
  - `table`
  - `tabs`
  - `dropdown-menu`

### Layout ALIENXIP OS

Criado em `app-next/src/components/layout/os-shell.tsx`.

Inclui:

- Sidebar lateral.
- Header/topbar.
- Area principal.
- Navegacao inicial.
- Indicacao visual de preview sem autenticacao real.

### Rotas iniciais

Criadas:

- `/os`
- `/os/dashboard`
- `/os/prospects`
- `/os/clients`
- `/os/projects`
- `/os/tech`
- `/os/wiki`
- `/os/settings`

### Prospects placeholder

Criado em `app-next/src/features/prospects/prospects-foundation.tsx`.

Escopo:

- Placeholder visual.
- Cards de metricas.
- Busca visual.
- Tabs de prioridade.
- Tabela com dados demonstrativos.

Nao foi feita migracao completa de dados.

### Estrutura de pastas

Estrutura criada/preparada:

- `app-next/src/app`
- `app-next/src/components`
- `app-next/src/features`
- `app-next/src/lib`
- `app-next/src/types`
- `app-next/src/server`
- `app-next/src/styles`
- `supabase/migrations`
- `docs`

### Extracao de logica de prospects

Criado:

- `src/features/prospects/prospect-normalization.mjs`
- `src/features/prospects/prospect-normalization.d.ts`
- `tests/prospects.test.mjs`

Funcoes extraidas:

- `parseCsv`
- `cityFromAddress`
- `firstUrl`
- `socialFrom`
- `priorityFor`
- `offerFor`
- `normalizeProspect`

A API legada `api/prospects.js` passou a importar `parseCsv` do modulo extraido, preservando o contrato da rota.

### Scripts preparados

No `package.json` raiz:

- `dev`: roda a nova ALIENXIP OS em Next.js.
- `dev:legacy`: roda o dashboard legado.
- `start`: roda o dashboard legado.
- `build`: roda build legado e build Next.
- `build:legacy`: valida sintaxe do legado.
- `build:next`: cria build de producao da app Next.
- `test`: roda testes Node.
- `lint`: roda ESLint da app Next.

## Como Rodar o Dashboard Legado

```bash
npm run dev:legacy
```

Abrir:

```text
http://localhost:3000
```

Validar API:

```text
http://localhost:3000/api/prospects
```

## Como Rodar a Nova ALIENXIP OS

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000/os
```

Se o legado ja estiver usando a porta 3000, rode a app Next diretamente em outra porta:

```bash
npm --prefix app-next run dev -- -p 3100
```

Abrir:

```text
http://localhost:3100/os
```

## Comandos Usados

```bash
git checkout -b sprint/01-foundation-alienxip-os
git tag recovery-stable-v1
npx create-next-app@latest app-next --yes --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npx shadcn@latest init --defaults --yes
npx shadcn@latest add card badge input table tabs dropdown-menu --yes
npm test
npm run lint
npm run build:legacy
npm run build:next
npm run build
```

## Validacoes Executadas

- `npm test`: passou.
- `npm run lint`: passou.
- `npm run build:legacy`: passou.
- `npm run build:next`: passou.
- `npm run build`: passou.
- Dashboard legado respondeu HTTP 200 em `/`.
- API legada respondeu HTTP 200 em `/api/prospects`.
- ALIENXIP OS respondeu HTTP 200 em `/os`.
- Prospects placeholder respondeu HTTP 200 em `/os/prospects`.

## Riscos Encontrados

- `create-next-app` reportou 2 vulnerabilidades moderadas na arvore da nova app. Pendente revisar com `npm audit` antes de promover qualquer deploy de producao.
- Existem dois lockfiles: um na raiz e outro em `app-next`. O `next.config.ts` foi ajustado com `turbopack.root` para evitar ambiguidade de workspace root.
- A autenticacao ainda e apenas visual; nao ha controle real de sessao ou permissao.
- Supabase ainda nao foi conectado; a estrutura de migrations foi apenas preparada.
- O dashboard legado ainda duplica algumas regras no `index.html`; a extracao iniciou pelo parser/API e pelas regras testadas, mas a UI legada ainda usa suas funcoes inline.

## Pendencias para Sprint 2

1. Criar projeto Supabase de desenvolvimento.
2. Criar migrations iniciais a partir de `docs/DATABASE_DRAFT.md`.
3. Configurar Supabase Auth em ambiente dev.
4. Implementar `profiles` e roles com RLS.
5. Criar importador idempotente da Google Sheet para `prospects`.
6. Fazer a tela `/os/prospects` ler dados reais do banco em dev.
7. Comparar contagens, prioridades e ofertas entre legado e OS.
8. Revisar vulnerabilidades moderadas apontadas pelo npm.
9. Definir preview deploy da app Next sem substituir producao.

## Estado Final

A Sprint 1 criou a base tecnica em paralelo. O dashboard legado continua preservado, a API `/api/prospects` continua funcionando, a nova ALIENXIP OS possui rotas iniciais e layout base, e a primeira parte da logica de prospects agora tem testes de paridade.
