# Sprint 03 Prospect Workspace Report

## Objetivo

Criar o workspace individual de cada prospect com dados principais, diagnostico digital, notas internas e timeline de atividades, preservando o dashboard legado e a rota `/api/prospects`.

## Branch e Checkpoint

- Branch criada: `sprint/03-prospect-workspace`
- Checkpoint antes das mudancas: commit `611a122` (`feat: add supabase auth and editable prospects foundation`)

## Rotas Novas

- `/os/prospects/[id]`: workspace individual do prospect.

Rotas mantidas:

- `/os/prospects`
- `/os/prospects/[id]/edit`
- `/os/login`
- dashboard legado `/`
- API legada `/api/prospects`

## Componentes Criados

- `app-next/src/features/prospects/prospect-workspace.tsx`
- `app-next/src/features/prospects/workspace-helpers.ts`
- `app-next/src/features/prospects/workspace-helpers.mjs`

O workspace contem:

- cabecalho com nome, status, temperatura e responsavel;
- links rapidos para Instagram, site e WhatsApp;
- botoes de voltar e editar;
- abas de Visao Geral, Diagnostico Digital, Notas, Timeline, Arquivos e Conversas.

## Abas Implementadas

### Visao Geral

Mostra:

- parceiro de negocios;
- URL do parceiro;
- segmento;
- localizacao;
- oferta sugerida;
- prioridade;
- observacoes gerais.

### Diagnostico Digital

Formulario ligado a `prospect_diagnostics` com:

- Facebook;
- Instagram;
- WhatsApp automatizado;
- Landing Page / Site;
- Google Meu Negocio;
- resumo do diagnostico;
- oportunidades identificadas.

Criar ou atualizar diagnostico registra atividade em `prospect_activities`.

### Notas

Usa `prospect_notes`.

Permite:

- listar notas;
- criar nota;
- editar nota existente conforme permissao do RLS;
- exibir autor e data.

Tipos usados:

- `observacao`
- `follow_up`
- `reuniao`
- `decisao`
- `risco`

### Timeline

Usa `prospect_activities`.

Mostra:

- tipo de atividade;
- data formatada;
- descricao.

Atividades registradas automaticamente:

- diagnostico criado;
- diagnostico atualizado;
- nota criada;
- prospect atualizado.

### Arquivos e Conversas

Criados como placeholders para sprints futuras. Nenhuma integracao externa ou chat real foi implementado.

## Acoes Server Criadas

Em `app-next/src/features/prospects/actions.ts`:

- `saveDiagnosticAction`
- `createNoteAction`
- `updateNoteAction`
- `updateProspectAction` passou a registrar atividade.

Em `app-next/src/features/auth/actions.ts`:

- `logoutAction`

## Data Layer

Em `app-next/src/features/prospects/data.ts`:

- `getProspects` agora aceita filtros basicos.
- `getProspectWorkspace` carrega prospect, diagnostico, notas, atividades e perfil.

## Melhorias em `/os/prospects`

- busca por nome;
- filtro por status;
- filtro por temperatura;
- nome do prospect clicavel para `/os/prospects/[id]`;
- botao `Abrir`;
- estado vazio e erro mantidos.

## Perfil e Logout

Topbar atualizada em `OsShell`:

- email do usuario;
- role quando existir em `profiles`;
- botao funcional `Sair`.

Sem Supabase configurado, o botao fica desabilitado e o app segue em fallback seguro.

## Validacoes Zod e Testes

Criado:

- `tests/prospect-workspace.test.mjs`

Cobertura:

- schema de diagnostico normaliza oportunidades;
- schema de nota rejeita conteudo vazio e aceita tipos da Sprint 3;
- helpers de timeline formatam label e data.

## Como Testar

Sem Supabase configurado:

```bash
npm test
npm run lint
npm run build
npm run dev
```

Com Supabase dev configurado:

1. Aplicar migrations da Sprint 2 e Sprint 3.
2. Criar usuario em Auth e profile correspondente.
3. Rodar `npm run import:prospects` ou criar prospect manualmente em `/os/prospects`.
4. Abrir `/os/prospects`.
5. Clicar em um prospect.
6. Criar/editar diagnostico.
7. Criar/editar nota.
8. Conferir timeline.
9. Clicar em `Sair` e confirmar retorno para `/os/login`.

## RLS

Como testar:

- leitura autenticada: usuario logado abre `/os/prospects`;
- criacao autenticada: usuario logado cria prospect/nota/diagnostico;
- anonimo: sem sessao deve ir para `/os/login`, e acesso direto ao Supabase REST nao deve ter policy anonima.

Limitacoes:

- Policies atuais ainda permitem edicao ampla para usuarios autenticados em ambiente dev.
- Edicao de nota propria deve ser refinada com policy baseada em `author_id`.
- Testes automatizados de RLS ainda dependem de Supabase dev real/CLI.

## Riscos

- A migration da Sprint 3 adiciona novos valores de enum; ambientes ja criados precisam aplicar a migration incremental.
- A UI de notas usa forms simples e nao possui estado otimista.
- Timeline depende de atividades geradas pelas server actions; dados antigos podem nao ter historico completo.
- Sem credenciais reais, a validacao foi feita com build e fallback seguro, nao com banco real.

## Pendencias

1. Criar policy especifica para editar apenas nota propria ou roles elevadas.
2. Adicionar edicao de diagnostico com feedback visual de sucesso/erro.
3. Adicionar filtros persistentes com valores selecionados na URL.
4. Criar testes automatizados com Supabase local.
5. Implementar anexos em Arquivos.
6. Implementar conversas apenas quando houver decisao de integracao.

## Recomendacao para Sprint 4

Transformar prospects em pipeline operacional:

1. adicionar kanban/pipeline por status;
2. converter prospect para company/client;
3. criar tarefas de follow-up;
4. melhorar RLS por ownership/role;
5. adicionar Supabase local tests;
6. iniciar modulo de clientes com base nos prospects ganhos.
