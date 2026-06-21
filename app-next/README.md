# MOTHERXIP Next App

Aplicacao Next.js principal do ALIENXIP Prospects / MOTHERXIP.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm start
```

`npm start` executa o servidor standalone gerado por `next build`.

## Railway

Este app esta preparado para Railway com:

- `output: "standalone"` em `next.config.ts`
- `railway.json` na raiz do repositorio com build, start, healthcheck e restart policy
- `NEXT_PUBLIC_SITE_URL` para URLs publicas como reset de senha

Use a raiz do repositorio como service root na Railway, pois arquivos operacionais como `prompts/` vivem fora de `app-next`.

Configure os secrets reais em Railway Variables. Nao coloque valores reais neste repositorio.
