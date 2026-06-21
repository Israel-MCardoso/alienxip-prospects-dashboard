# ALIENXIP Prospects / MOTHERXIP

Sistema operacional interno da ALIENXIP para prospects, operacao comercial, outreach e rotinas da Mothership.

## App Principal

O produto em producao fica em `app-next/`.

- Next.js App Router
- React
- TypeScript
- Supabase Auth e dados operacionais
- Railway como plataforma de hosting

Os arquivos legados na raiz continuam no repositorio apenas por compatibilidade historica e validacao de build.

## Desenvolvimento Local

```bash
npm install
npm --prefix app-next install
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Build e Validacao

```bash
npm run lint
npm run build
```

O build da raiz valida os arquivos legados criticos e compila o app Next.js em `app-next`.

## Deploy

O deploy principal agora e Railway.

- Configuracao raiz: `railway.json`
- Service root recomendado: raiz do repositorio
- Branch de producao: `main`
- Healthcheck: `/os/login`

Consulte `docs/RAILWAY_MIGRATION_RUNBOOK.md` antes de alterar variaveis, dominio ou fluxo de deploy.

## Variaveis de Ambiente

Use `.env.example` e `app-next/.env.example` apenas como referencia de nomes.

Nunca commite:

- `.env`
- `.env.local`
- chaves Supabase service role
- secrets de webhook
- chaves de provedores AI

Valores reais devem ficar em Railway Variables e em ambientes locais ignorados pelo Git.
