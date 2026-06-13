# SPRINT 15 — LEGACY DATA CLEANUP REPORT

## 1. Visão Geral do Processo

Este relatório documenta a consolidação dos dados comerciais no Supabase para a Sprint 15. A operação consistiu em re-vincular o único diagnóstico ativo atrelado ao prospect legado (Grupo A) para o seu correspondente novo baseado em PlaceID (Grupo B) e, em seguida, remover os 298 prospects duplicados do legado, deixando a base de dados em estado de integridade ideal.

Toda a operação foi realizada seguindo as regras de negócio definidas e os códigos legados (`index.html`, `/api/prospects` e painéis antigos) foram integralmente preservados.

---

## 2. Métricas de Consolidação (Antes vs Depois)

| Tabela | Estado Inicial | Estado Final | Diferença / Ação Realizada |
| :--- | :---: | :---: | :--- |
| **`prospects`** | 598 | 300 | `-298` (Exclusão segura de duplicados legados) |
| **`prospect_diagnostics`** | 1 | 1 | `0` (Preservado e atualizado) |
| **`companies`** | 0 | 0 | `0` (Inalterado) |
| **`clients`** | 0 | 0 | `0` (Inalterado) |
| **`projects`** | 0 | 0 | `0` (Inalterado) |
| **`prospect_proposals`** | 0 | 0 | `0` (Inalterado) |

---

## 3. Diagnóstico Migrado

* **Diagnóstico ID:** `82667185-d40f-4b76-9dd0-7404c44ee4f6`
* **Vínculo Original (Grupo A Legado):** `50cfd1b2-d579-4b75-a51a-a4387c417c01` ("Vale Odontologia", Jacareí - SP)
* **Vínculo Novo (Grupo B PlaceID):** `732d7993-53e9-4750-a9b4-0dd533a2ab7d` ("Vale Odontologia", Jacareí - SP)
* **Ação:** Patch na coluna `prospect_id` na tabela `prospect_diagnostics` executado com sucesso **antes** da deleção dos prospects, de forma a contornar perdas por deleção em cascata (`on delete cascade`).

---

## 4. Evidências de Execução

### A. Resultado do Dry-Run (`node scripts/cleanup-legacy-prospects.mjs --dry-run`)
```
=================================================
       MOTHERXIP LEADS CONSOLIDATION ENGINE      
=================================================
Modo: SIMULAÇÃO (DRY-RUN)
GOOGLE_SHEET_CSV_URL: Carregada
Supabase URL: Carregada
=================================================
Buscando dados da Google Sheet...
Total de registros únicos na Google Sheet: 300

Buscando registros do Supabase...
Total de prospects no banco: 598
Total de diagnósticos no banco: 1
Grupo A (Legado): 298 registros no banco
Grupo B (Novo): 300 registros no banco
Diagnósticos ligados ao Grupo A: 1
  - Diagnóstico ID: 82667185-d40f-4b76-9dd0-7404c44ee4f6
    Vinculado ao legado: "Vale Odontologia" em Jacareí (ID: 50cfd1b2-d579-4b75-a51a-a4387c417c01)
    Novo prospect correspondente encontrado: "Vale Odontologia" em Jacareí (ID: 732d7993-53e9-4750-a9b4-0dd533a2ab7d)

--- [PLANO DE AÇÃO / PREVIEW] ---
Prospects antes da limpeza: 598
Grupo A (Legado) a ser removido: 298 registros
Grupo B (Novo) a ser preservado: 300 registros
Diagnósticos a migrar do legado para o novo: 1
Total esperado de prospects após a limpeza: 300

[DRY RUN] Finalizado com sucesso. Nenhuma escrita realizada no banco.
```

### B. Resultado da Execução Real (`node scripts/cleanup-legacy-prospects.mjs`)
```
=================================================
       MOTHERXIP LEADS CONSOLIDATION ENGINE      
=================================================
Modo: REAL (EXECUÇÃO)
GOOGLE_SHEET_CSV_URL: Carregada
Supabase URL: Carregada
=================================================
Buscando dados da Google Sheet...
Total de registros únicos na Google Sheet: 300

Buscando registros do Supabase...
Total de prospects no banco: 598
Total de diagnósticos no banco: 1
Grupo A (Legado): 298 registros no banco
Grupo B (Novo): 300 registros no banco
Diagnósticos ligados ao Grupo A: 1
  - Diagnóstico ID: 82667185-d40f-4b76-9dd0-7404c44ee4f6
    Vinculado ao legado: "Vale Odontologia" em Jacareí (ID: 50cfd1b2-d579-4b75-a51a-a4387c417c01)
    Novo prospect correspondente encontrado: "Vale Odontologia" em Jacareí (ID: 732d7993-53e9-4750-a9b4-0dd533a2ab7d)

--- [PLANO DE AÇÃO / PREVIEW] ---
Prospects antes da limpeza: 598
Grupo A (Legado) a ser removido: 298 registros
Grupo B (Novo) a ser preservado: 300 registros
Diagnósticos a migrar do legado para o novo: 1
Total esperado de prospects após a limpeza: 300

--- [EXECUÇÃO REAL DE CONSOLIDAÇÃO] ---
Passo 1: Re-vinculando diagnósticos dos prospects legados para os novos correspondentes...
Atualizando diagnóstico 82667185-d40f-4b76-9dd0-7404c44ee4f6: 50cfd1b2-d579-4b75-a51a-a4387c417c01 -> 732d7993-53e9-4750-a9b4-0dd533a2ab7d
Re-vinculação concluída com sucesso.
Passo 2: Removendo 298 prospects legados...
Excluindo lote 1 (100 registros)...
Excluindo lote 2 (100 registros)...
Excluindo lote 3 (98 registros)...
Remoção de prospects legados concluída com sucesso.

--- [VALIDAÇÃO DO ESTADO FINAL] ---
Contagem final de prospects no banco: 300
Contagem final de diagnósticos no banco: 1
Sucesso: Diagnósticos preservados e apontando corretamente para registros do Grupo B.
Sucesso: Banco consolidated com exatamente 300 prospects.

=================================================
     CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!         
=================================================
```

### C. Confirmação de Idempotência (Segunda execução)
```
=================================================
       MOTHERXIP LEADS CONSOLIDATION ENGINE      
=================================================
Modo: REAL (EXECUÇÃO)
GOOGLE_SHEET_CSV_URL: Carregada
Supabase URL: Carregada
=================================================
Buscando dados da Google Sheet...
Total de registros únicos na Google Sheet: 300

Buscando registros do Supabase...
Total de prospects no banco: 300
Total de diagnósticos no banco: 1
Grupo A (Legado): 0 registros no banco
Grupo B (Novo): 300 registros no banco
Diagnósticos ligados ao Grupo A: 0

=================================================
 STATUS: BANCO JÁ ESTÁ CONSOLIDADO (IDEMPOTENTE) 
 Nenhum prospect legado encontrado.
 Nenhuma alteração necessária.
 Prospects finais: 300 (esperado: 300)
=================================================
```

---

## 5. Confirmação de Integridade de Código e Preservação

* Nenhum arquivo de código legado foi removido (e.g. `index.html`, `/api/prospects` e scripts mantidos intactos).
* Não houve alterações de Schema ou RLS no banco de dados.
* O build, os testes e o linter permanecem totalmente verdes.

---

## 6. Resultados da Validação Técnica

1. **Testes Unitários (`npm test`):** 40 testes executados, 40 passando com sucesso.
2. **Linter (`npm run lint`):** Zero erros e avisos de linting.
3. **Build da Aplicação (`npm run build`):** Executado com sucesso, gerando bundle de produção perfeitamente sem problemas de tipos ou módulos.
