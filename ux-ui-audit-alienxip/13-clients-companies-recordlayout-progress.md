# Clients/Companies RecordLayout Progress - MOTHERXIP OS

Data: 2026-06-22

## Arquivos alterados

- `app-next/src/app/os/(protected)/clients/[id]/page.tsx`
- `app-next/src/app/os/(protected)/companies/[id]/page.tsx`
- `ux-ui-audit-alienxip/13-clients-companies-recordlayout-progress.md`

## O que foi migrado

- `/os/clients/[id]` passou a usar `RecordLayout`, `RecordHeader`, `RecordPropertiesPanel` e `RecordActionsPanel`.
- `/os/companies/[id]` passou a usar `RecordLayout`, `RecordHeader`, `RecordPropertiesPanel` e `RecordActionsPanel`.
- Cliente agora segue ficha CRM com propriedades à esquerda, formulário/projetos/arquivos no centro e ações/resumos à direita.
- Empresa agora segue ficha CRM com propriedades à esquerda, edição/clientes/projetos no centro e ações/resumos/observações à direita.
- Estados vazios de projetos, clientes e arquivos ficaram mais consistentes com o Design System dark/cyber.
- Selects nativos do formulário de Cliente foram trocados por `CustomSelect`, preservando submissão por hidden input e Server Action.

## O que foi preservado

- Sem alteração de banco de dados.
- Sem alteração de regras de negócio.
- Server Actions existentes mantidas:
  - `updateClientAction`
  - `archiveClientAction`
  - `restoreClientAction`
  - `updateCompanyAction`
- Formulário de edição de Cliente preservado.
- Formulário de edição de Empresa preservado.
- Criação de projeto para Cliente preservada via `ProjectForm`.
- Projetos, arquivos, playbooks, clientes vinculados e relações existentes foram mantidos.
- Supabase e arquitetura atual foram mantidos.

## TODOs mantidos como placeholders seguros

- Criar tarefa vinculada diretamente a Cliente: ação segura ainda não existe nesta tela.
- Criar cliente diretamente pela tela de Empresa: ação segura específica ainda não existe nesta tela.
- Criar tarefa vinculada diretamente a Empresa: ação segura ainda não existe nesta tela.
- Prospects relacionados à Empresa não foram exibidos porque a tela atual não carrega esse dado e a etapa não podia alterar contratos de dados/banco.
- Histórico/atividades específicas de Cliente/Empresa não foram exibidas porque as páginas atuais não carregam essas coleções.

## Riscos identificados

- Links externos em ações rápidas de Empresa usam o valor já salvo nos campos `website_url`, `instagram_url` e `whatsapp`; não houve validação nova de conteúdo.
- O build mantém warning não bloqueante antigo do Turbopack/NFT ligado a `src/lib/ai/prompts.ts` via `src/features/ai/actions.ts`; não foi causado por esta etapa.
- As ações de arquivar/restaurar Cliente continuam no cabeçalho para preservar Server Actions por formulário seguro.

## Validações executadas

- `npm run lint`: passou.
- `npm run build`: passou.
  - Observação: warning não bloqueante existente sobre trace dinâmico em AI prompts.
- `npm test`: passou, 98/98 testes.
- `node node_modules/typescript/bin/tsc --noEmit`: passou.

## Resultado

Clientes e Empresas agora estão visualmente mais próximos de uma ficha de CRM estilo HubSpot, com propriedades laterais, conteúdo central e associações/ações contextuais à direita, mantendo funcionalidades atuais e sem alteração de banco de dados.
