# ALIENXIP OS Migration Strategy

## 1. Objetivo

Migrar o `alienxip-prospects-dashboard` para uma plataforma interna robusta chamada ALIENXIP OS sem quebrar o dashboard atual, sem perder dados e sem introduzir mudancas grandes antes de validacao.

## 2. Decisao Recomendada

Evoluir no mesmo repositorio, criando a nova base em paralelo.

Motivos:

- O repositorio atual e pequeno e bem compreensivel.
- O dashboard existente ja representa o primeiro modulo real do ALIENXIP OS.
- O historico do GitHub e o deploy da Vercel continuam conectados.
- O fallback fica facil de manter.
- A migracao pode ser feita por etapas e preview deploys.

Criar um novo repositorio agora aumentaria custo operacional sem ganho proporcional. A separacao pode acontecer depois, se ALIENXIP OS virar produto com ciclo e equipe independentes.

## 3. O Que Manter

### Manter como fallback

- `index.html`
- `api/prospects.js`
- `vercel.json`
- Deploy atual na Vercel

### Manter como comportamento

- Busca por empresa, segmento, cidade ou oferta.
- Filtro por prioridade.
- Filtro por presenca de site, WhatsApp ou rede social.
- Metricas: total de prospects, prioridade alta, com site, com rede social, com WhatsApp.
- Tabela operacional com dados principais.
- Priorizacao `Alta`, `Media`, `Baixa`.
- Sugestoes de oferta por segmento.

### Manter como fonte temporaria

- Google Sheet publica via CSV.
- Endpoint `/api/prospects` enquanto o banco ainda nao for fonte primaria.

## 4. O Que Descartar

Descartar gradualmente, nao de imediato:

- Manipulacao manual de DOM.
- Script frontend monolitico dentro de `index.html`.
- Regras de negocio misturadas com renderizacao.
- Google Sheet como fonte runtime principal.
- Fallback hardcoded de URL da planilha como configuracao de longo prazo.
- Build que valida pouco alem de sintaxe.

## 5. O Que Migrar

### Migrar para modulos de dominio

- `parseCsv`
- `cityFromAddress`
- `firstUrl`
- `socialFrom`
- `priorityFor`
- `offerFor`
- `normalize`

### Migrar para componentes

- Header operacional.
- Barra de filtros.
- Cards de metricas.
- Tabela de prospects.
- Celulas de link.
- Badge de prioridade.
- Estados de loading e erro.

### Migrar para banco

- Dados brutos da planilha.
- Campos normalizados.
- Score e motivo de prioridade.
- Historico de diagnosticos, notas e mensagens.
- Atividades dos usuarios.

## 6. Estrategia de Migracao Incremental

### Etapa 1: Congelar uma referencia segura

1. Criar tag do estado atual, por exemplo `legacy-prospects-dashboard-YYYYMMDD`.
2. Confirmar que `npm run build` passa.
3. Confirmar que o deploy atual esta funcional.
4. Registrar URL do deploy atual e commit usado.

### Etapa 2: Criar base nova em branch

1. Criar branch `feature/alienxip-os-foundation`.
2. Introduzir Next.js + TypeScript sem remover arquivos legados.
3. Manter `index.html` disponivel ate uma decisao explicita de roteamento.
4. Configurar preview deploy na Vercel.

### Etapa 3: Extrair regras do dashboard atual

1. Copiar regras para modulos testaveis.
2. Criar testes de unidade para prioridade, oferta e normalizacao.
3. Usar os mesmos dados da planilha para comparar resultados.

### Etapa 4: Criar Supabase em desenvolvimento

1. Criar projeto Supabase dev.
2. Criar migrations.
3. Configurar RLS.
4. Configurar auth.
5. Criar `.env.example` atualizado.

### Etapa 5: Importar dados

1. Criar script manual de importacao.
2. Ler Google Sheet.
3. Calcular hash por linha.
4. Fazer upsert em `prospects`.
5. Registrar importacao em `activities` ou tabela de import logs.

### Etapa 6: Recriar Prospects no ALIENXIP OS

1. Criar tela autenticada de prospects.
2. Recriar filtros e metricas.
3. Comparar contagens com dashboard legado.
4. Validar prioridades e ofertas.
5. Liberar para uso interno limitado.

### Etapa 7: Troca controlada

1. Manter dashboard legado acessivel em rota ou branch/tag.
2. Promover nova aplicacao para producao somente depois de aceite.
3. Monitorar erros e uso.
4. Manter rollback pronto por pelo menos uma sprint.

## 7. Como Evitar Quebra do Deploy Atual

- Nao remover `index.html` durante a fase de fundacao.
- Nao alterar regras de UI do dashboard atual.
- Nao alterar `vercel.json` para roteamento Next.js antes da nova app estar validada.
- Usar branch e preview deploy.
- Criar tag antes de cada mudanca estrutural.
- Rodar `npm run build` antes de qualquer push.
- Conferir `/` e `/api/prospects` depois de qualquer alteracao.

## 8. Plano de Rollback

Rollback rapido:

1. Reverter para a tag do dashboard legado.
2. Redeploy na Vercel a partir do commit/tag seguro.
3. Manter Google Sheet como fonte.
4. Desabilitar variaveis ou rotas novas se causarem conflito.

Rollback de dados:

1. Exportar dados do Supabase antes de importacoes grandes.
2. Manter `source_row_hash` para identificar registros importados.
3. Reverter importacoes por lote usando `import_batch_id`.
4. Nunca apagar a Google Sheet original durante a migracao.

Rollback funcional:

1. Manter usuarios usando o dashboard legado.
2. Desabilitar acesso ao ALIENXIP OS preview.
3. Corrigir em branch.
4. Revalidar com checklist antes de nova tentativa.

## 9. Checklist Antes da Migracao

Repositorio e deploy:

- [ ] Branch de migracao criada.
- [ ] Tag do estado atual criada.
- [ ] Deploy atual validado.
- [ ] Preview deploy configurado.
- [ ] `npm run build` passando.

Dados:

- [ ] Backup/export da Google Sheet.
- [ ] Campos da planilha mapeados.
- [ ] Hash por linha definido.
- [ ] Estrategia de upsert definida.
- [ ] Plano para evitar duplicidade definido.

Seguranca:

- [ ] `.env.example` atualizado.
- [ ] Nenhum segredo versionado.
- [ ] Supabase Auth planejado.
- [ ] RLS planejada antes de dados reais.
- [ ] Cadastro publico desativado.

Produto:

- [ ] Fluxo atual de prospects documentado.
- [ ] Regras de prioridade documentadas.
- [ ] Regras de oferta documentadas.
- [ ] Criterios de paridade definidos.
- [ ] Usuarios internos de teste definidos.

Operacao:

- [ ] Plano de rollback revisado.
- [ ] Responsavel por aceite definido.
- [ ] Janela de migracao definida.
- [ ] Monitoramento basico definido.

## 10. Marcos de Aceite

Marco 1: Fundacao pronta

- Nova app roda localmente.
- Auth placeholder ou real em ambiente dev.
- Dashboard legado intacto.

Marco 2: Dados migrados em dev

- Prospects importados para Supabase dev.
- Contagem bate com Google Sheet.
- Duplicidade controlada.

Marco 3: Paridade funcional

- Nova tela lista prospects.
- Filtros e metricas equivalentes.
- Prioridade e oferta batem com legado.

Marco 4: Uso interno controlado

- Usuarios autenticados acessam preview.
- Notas e diagnosticos persistem.
- Atividades registradas.

Marco 5: Producao

- Variaveis configuradas.
- RLS ativa.
- Rollback pronto.
- Nova versao promovida.
