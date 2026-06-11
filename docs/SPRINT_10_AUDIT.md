# ALIENXIP OS - SPRINT 10 AUDIT REPORT
## Auditoria de Rota, UX, Banco de Dados, RLS, CRUDs e Usabilidade Geral

Este documento apresenta a auditoria completa do estado atual da **ALIENXIP OS** antes do início das melhorias da Sprint 10.

---

## 1. Mapeamento de Rotas e Componentes

### 1.1 Rotas Atuais
- `/os` - Home da plataforma. Atualmente exibe informações estáticas e desatualizadas da Sprint 2.
- `/os/dashboard` - Painel principal do usuário. Mostra métricas operacionais básicas, timeline genérica e tarefas pendentes.
- `/os/activity` - Histórico operacional global.
- `/os/calendar` - Calendário de tarefas.
- `/os/clients` - Listagem de clientes convertidos.
- `/os/clients/[id]` - Detalhes do cliente, com formulário de projetos e arquivos.
- `/os/companies` - Listagem de empresas.
- `/os/companies/[id]` - Detalhes da empresa.
- `/os/projects` - Listagem de projetos operacionais.
- `/os/projects/[id]` - Workspace do projeto com abas para tarefas, timeline, arquivos, notas e wiki.
- `/os/prospects` - CRM de prospects.
- `/os/prospects/[id]` - Workspace do prospect com abas para diagnóstico, notas, tarefas, arquivos e timeline.
- `/os/prospects/[id]/edit` - Edição básica de dados de prospects.
- `/os/prospects/pipeline` - Pipeline Kanban comercial dos prospects.
- `/os/wiki` - Base de conhecimento wiki.
- `/os/wiki/[slug]` - Visualização e edição de página wiki.
- `/os/playbooks` - Biblioteca de playbooks operacionais.
- `/os/playbooks/[id]` - Visualização, edição, duplicação e publicação de playbooks.
- `/os/tech` - Painel do Tech Center.
- `/os/tech/bugs` - Gestão de bugs.
- `/os/tech/incidents` - Gestão de incidentes técnicos.
- `/os/tech/backlog` - Backlog técnico.
- `/os/tech/roadmap` - Roadmap de produto.
- `/os/tech/decisions` - ADRs (Decisões de Arquitetura).
- `/os/files` - Central de arquivos agregada.
- `/os/settings` - Rota de configurações (atualmente um placeholder puro).
- `/os/login` - Tela de autenticação baseada em Supabase Auth.

---

## 2. Lacunas e Gaps Encontrados

### 2.1 Páginas Incompletas e Placeholders
- **Settings (`/os/settings`):** Exibe um componente `ModulePage` genérico que serve apenas como lista de itens futuros ("Usuários", "Papéis", "Integrações"). Sem qualquer usabilidade real.
- **Home (`/os`):** Exibe cards com textos desatualizados (Sprint 2).
- **Projetos -> Settings:** A aba de configurações de um projeto individual é apenas um card placeholder sem ações.
- **Prospects -> Conversas:** A aba de conversas é um placeholder estático ("Chat real e integrações não implementados").
- **Visualização Individual Tech:** Itens do Tech Center (Bugs, Incidentes, Backlog, Roadmap, Decisões) não possuem páginas de detalhes. O usuário visualiza apenas uma tabela e formulários de criação agrupados.

### 2.2 CRUDs Incompletos
Para que a plataforma seja operável no dia a dia, todos os recursos devem ser fáceis de gerenciar (Criar, Editar, Arquivar, Restaurar, Duplicar).
- **Prospects:** Falta funcionalidade de **Arquivar** (mudar status para `archived`), **Restaurar** e **Duplicar**.
- **Clientes:** Detalhe do cliente é puramente leitura. Não há formulário de **Edição**, **Exclusão/Arquivamento** ou **Duplicação**.
- **Empresas:** Não podem ser criadas diretamente no painel (apenas pela conversão de prospects), não podem ser **Editadas** ou **Arquivadas/Excluídas**.
- **Projetos:** Só é possível atualizar o status. Não há edição completa de informações (nome, descrição, prazos, responsável), nem **Duplicação** ou **Arquivamento**.
- **Tarefas (Tasks):** Só podem ser criadas e concluídas. Não há **Edição**, **Exclusão** ou **Duplicação**.
- **Tech Center (Bugs, Incidentes, Backlog, Roadmap, Decisões):** Não possuem formulários de **Edição** ou **Remoção/Arquivamento**. O usuário não consegue corrigir erros de digitação ou cancelar um item após criá-lo.
- **Wiki & Playbooks:** Playbooks possuem duplicação, mas wiki não possui. Ambos carecem de funcionalidade para **Restaurar** de estados arquivados na interface.

### 2.3 IDs Visíveis e Relacionamentos Quebrados
- **UUIDs expostos:** Em vez de exibir nomes e descrições humanas, o sistema exibe IDs do Supabase em vários locais críticos:
  - No detalhe do prospect: exibe `responsible_user_id` e `converted_client_id` como UUIDs brutos.
  - No workspace de projetos: exibe `project.client_id`, `project.company_id`, `project.owner_id` e `project.created_by` como UUIDs.
  - Na Central de Atividades e central de Arquivos.
  - Na tabela do Tech Center: vincula a ID do projeto e do cliente de forma textual bruta.
- **Falta de Hiperlinks contextuais:** Ao navegar por um projeto, o cliente associado não possui link clicável rápido na tela de visão geral, dificultando a navegação fluida de Prospect -> Cliente -> Projeto -> Tarefas.

### 2.4 Navegação e Breadcrumbs
- Falta de um cabeçalho unificado com breadcrumbs do tipo `Projetos > [Nome do Projeto] > Tarefas`.
- Navegação atual é feita por botões simples de "Voltar" ou via sidebar.

### 2.5 Activity Feed
- O feed operacional exibe eventos gravados, mas as mensagens combinam nomes de autores via lookup com IDs cruas no corpo, criando poluição visual (ex: "Israel criou o projeto X" mas mostrando o UUID do cliente ou da empresa em subtítulos).

### 2.6 Busca Global (Ctrl + K)
- O modal de busca global retorna resultados brutos e simplificados.
- Falta de identificação visual clara de ícones de tipo, tags de status dos itens encontrados e navegação integrada com atalhos de teclado de alto padrão (ex: Raycast/Linear).

### 2.7 Estados Vazios (Empty States)
- Várias telas utilizam apenas textos cinzas simples como "Nenhuma tarefa ainda" ou "Nenhum arquivo enviado".
- Falta de acabamento premium, micro-ilustrações/ícones adequados e incentivos de ação (CTA).

### 2.8 Responsividade Mobile
- **Navegação Quebrada no Mobile:** A sidebar é ocultada com a classe Tailwind `hidden lg:flex`. Contudo, **não há botão de menu (hamburger)** no cabeçalho ou menu flutuante para acessá-la em dispositivos menores. Um usuário em celular fica preso sem conseguir trocar de rota.
- **Tabelas Estouradas:** As tabelas de projetos, tarefas e bugs quebram a largura da tela em celulares e tablets por falta de rolagem horizontal adequada (`overflow-x-auto`) ou adaptatividade em formato card.

---

## 3. Estrutura do Banco de Dados e RLS

### 3.1 Tabelas e Relacionamentos
- A modelagem das tabelas está madura e unificada (migrations organizadas de Sprint 2 a Sprint 9).
- Relações cruciais de integridade referencial estão declaradas com chaves estrangeiras apropriadas (ex: `project_id references projects(id) on delete set null`).

### 3.2 Políticas de RLS
- As políticas de segurança RLS (Row Level Security) estão ativas e bem definidas no Supabase.
- Funções auxiliares como `is_admin_or_owner()` e `has_app_role(app_role)` garantem permissões corretas para os papéis `admin`, `operator` e `viewer`.

---

## 4. Plano de Ação para a Sprint 10

1. **Correção Visual & Tema Dark:** Ajustar o `globals.css` para aplicar a paleta obrigatória da ALIENXIP OS (Preto Absoluto `#050505` como fundo principal) e forçar a classe `.dark` permanentemente no HTML.
2. **Dashboard Operacional Real:** Refatorar o dashboard em `/os/dashboard` implementando todos os blocos analíticos exigidos e o card de "Ações Rápidas" com modais/formulários integrados para criação ágil.
3. **Consolidação de CRUDs e Eliminação de UUIDs:** Substituir todos os UUIDs expostos por nomes correspondentes e implementar as ações que faltam (Edição de Clientes, Projetos, Empresas, Tarefas e Tech Center).
4. **Navegação & Responsividade Mobile:** Adicionar um menu lateral deslizante (Drawer) para mobile e ajustar as tabelas e cards para dispositivos portáteis.
5. **Idempotência no Seed:** Criar a tarefa e script `npm run seed:knowledge` para popular a Wiki e Playbooks oficiais sem duplicar registros.
