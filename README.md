# ALIENXIP Prospects Dashboard

Dashboard interno da ALIENXIP para visualizar, filtrar e priorizar prospects comerciais a partir de uma planilha Google publicada como CSV.

## Tecnologias

- HTML, CSS e JavaScript sem framework frontend.
- Vercel Serverless Function em `api/prospects.js`.
- Node.js para desenvolvimento local e validação de build.
- Google Sheets como fonte de dados CSV.
- Deploy na Vercel com `vercel.json`.

## Estrutura

```text
.
├── api/
│   └── prospects.js
├── scripts/
│   └── dev-server.mjs
├── index.html
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` quando precisar sobrescrever a fonte de dados localmente.

```env
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv&gid=0
PORT=3000
```

- `GOOGLE_SHEET_CSV_URL`: URL CSV da planilha usada pela API. Se ausente, o projeto usa a URL atualmente configurada no código para manter compatibilidade com a produção existente.
- `PORT`: porta do servidor local. Padrão: `3000`.

Não versione `.env`, `.env.local` ou arquivos equivalentes com valores reais.

## Instalação

```bash
npm install
```

## Desenvolvimento Local

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

A rota local `/api/prospects` simula a função serverless da Vercel e carrega os dados da planilha.

## Build

```bash
npm run build
```

O build atual valida a sintaxe dos arquivos JavaScript críticos. Como o frontend é estático e não há bundler, não existe etapa de compilação de assets.

## Deploy

O projeto está preparado para deploy na Vercel:

- `index.html` é servido como frontend estático.
- `api/prospects.js` é publicado como Serverless Function.
- `vercel.json` define headers de cache para revalidação.

Para produção, configure `GOOGLE_SHEET_CSV_URL` nas variáveis de ambiente da Vercel caso queira remover dependência do fallback hardcoded.

## Observações

- Não há framework como React, Next.js ou Vite neste momento.
- Não há banco de dados próprio; a fonte de dados é Google Sheets.
- Não há autenticação no dashboard.
- A planilha precisa continuar acessível para que `/api/prospects` retorne dados.
- Antes de transformar esta aplicação na plataforma interna principal, recomenda-se adicionar autenticação, camada de permissões, testes automatizados e uma fonte de dados mais robusta.
