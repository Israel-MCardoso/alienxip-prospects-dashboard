# 15 - Company/Client Actions Progress

## 1. Arquivos alterados

- `app-next/src/features/commercial/actions.ts`
- `app-next/src/features/operations/actions.ts`
- `app-next/src/features/workspace/data.ts`
- `app-next/src/app/os/(protected)/companies/[id]/page.tsx`
- `app-next/src/app/os/(protected)/clients/[id]/page.tsx`
- `app-next/src/app/os/(protected)/activity/page.tsx`
- `tests/company-client-actions.test.mjs`

## 2. Criacao de cliente pela Empresa

Ativada com `createClientFromCompanyAction(companyId, formData)`.

A action:

- valida Supabase configurado;
- valida usuario autenticado com `supabase.auth.getUser()`;
- confirma que a empresa existe;
- cria `clients` com `company_id` da empresa atual;
- usa defaults seguros para `status` (`active`) e `contract_status` (`draft`);
- preenche contato principal, email, telefone, valor mensal e data de inicio apenas quando enviados;
- registra activity em `client` e `company`;
- revalida `/os/companies/[id]`, `/os/clients/[id]`, `/os/clients`, `/os/activity` e `/os/dashboard`.

Na ficha da Empresa, o painel direito agora possui formulario compacto "Criar cliente" com `CustomSelect` para status e status de contrato.

## 3. Revalidacoes adicionadas

`createGeneralTaskAction` agora revalida tambem:

- `/os/clients/${task.client_id}`, quando a tarefa nasce vinculada a cliente;
- `/os/companies/${task.company_id}`, quando a tarefa nasce vinculada a empresa.

As revalidacoes existentes de tarefas, calendario, activity e dashboard foram preservadas.

## 4. Feed real de atividades

Implementado sem migration.

A tabela global `activities` ja possui `entity_type` e `entity_id`, entao `getActivities` foi ampliado para aceitar `company_id` como alias seguro de `entity_id`. As fichas agora buscam:

- Cliente: `getActivities({ entity_type: "client", client_id: id })`
- Empresa: `getActivities({ entity_type: "company", company_id: id })`

Para evitar duplicacao visual, os itens sinteticos de cadastro sao omitidos quando ja existe activity real `client_created` ou `company_created`.

## 5. Melhorias em acoes rapidas

Empresa:

- "Criar cliente" deixou de ser placeholder e virou fluxo real no painel direito.
- "Criar tarefa" permanece real.
- Website, Instagram e WhatsApp continuam seguros e desabilitados quando ausentes.
- Resumos de clientes e projetos vinculados foram preservados.

Cliente:

- "Criar tarefa" passa a atualizar a ficha especifica pelo ajuste de revalidacao.
- "Criar projeto" permanece preservado.
- Resumos de projetos ativos, arquivos recentes e playbooks relacionados foram preservados.
- Arquivar/restaurar cliente foram preservados no cabecalho.

## 6. Placeholders mantidos

Nenhum placeholder funcional novo foi adicionado nesta etapa.

## 7. Riscos

- A criacao de cliente depende das permissoes/RLS atuais da tabela `clients`; nenhuma policy foi alterada.
- O feed real de activities mostra apenas eventos registrados no padrao global `activities`. Historicos antigos que nunca foram gravados nessa tabela continuam representados pelos itens operacionais sinteticos.
- O build segue exibindo warning antigo de Turbopack/NFT relacionado a `src/lib/ai/prompts.ts`, ja existente e fora do escopo desta etapa.

## 8. Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou; warning antigo de NFT/Turbopack em `src/lib/ai/prompts.ts`.
- `npm test`: passou, 102 testes.
- `node node_modules/typescript/bin/tsc --noEmit`: na raiz nao ha `node_modules/typescript/bin/tsc`; validacao equivalente executada em `app-next` com `node node_modules/typescript/bin/tsc --noEmit` e passou.

## 9. Proximos passos recomendados

- Validar manualmente em staging/producao a criacao de cliente a partir de uma Empresa real com usuario autenticado.
- Revisar RLS em Supabase para confirmar que usuarios autorizados podem inserir clientes vinculados a empresas sem usar chave privilegiada.
- Em etapa futura, considerar activity fan-out para tarefa criada em cliente/empresa se o produto quiser que a tarefa apareca tambem como activity direta de cada entidade, alem do registro `task`.
