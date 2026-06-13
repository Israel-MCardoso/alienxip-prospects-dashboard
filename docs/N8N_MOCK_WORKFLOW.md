# MOCK N8N OUTREACH WORKFLOW BLUEPRINT & INTEGRATION GUIDE

Este guia detalha o funcionamento, configuração e homologação do fluxo de integração entre o **MOTHERXIP** e o motor de automação **n8n**. Ele foi desenhado para simular de forma realista toda a comunicação e transição de estados dos leads.

---

## 1. FLUXO DE AUTOMAÇÃO MOCK

O workflow no n8n recebe as requisições de dispatch do MOTHERXIP, realiza o processamento e devolve atualizações de status conforme o progresso do lead na régua de comunicação.

```
[MOTHERXIP] (Dispatch)
      │
      ▼
[n8n Webhook Trigger] ──► [Gravar Status: queued]
      │
      ▼
[Delay Node] (15s) ──► [Gravar Status: sent]
      │
      ▼
[Delay Node] (30s) ──► [Gravar Status: delivered]
      │
      ▼
[Delay Node] (60s) ──► [Gravar Status: waiting_reply]
      │
      ▼
[Delay Node] (120s) ──► [Simular Resposta: replied]
      │
      ▼
[Delay Node] (180s) ──► [Negociação: negotiating]
      │
      ▼
[Delay Node] (240s) ──► [Agendamento: meeting_scheduled]
```

### Configurações de Delays & Retomadas
Cada etapa do fluxo mock utiliza nós de **Delay (n8n-nodes-base.wait)** com valores configuráveis para simular tempos de entrega realistas de WhatsApp (recomendado: de 1 a 5 minutos na homologação). 

Se um lead for marcado como **Pausado (paused)** ou **Parado (stopped)** pelo painel do MOTHERXIP, o n8n deve abortar a execução ativa verificando o status no Supabase a cada etapa antes de enviar a próxima mensagem.

---

## 2. SIMULAÇÃO DE CENÁRIOS OPERACIONAIS

Para fins de teste, o workflow mock do n8n pode simular respostas negativas ou falhas enviando payloads específicos ao webhook do MOTHERXIP:

### Cenário A: Falha na Entrega (failed)
Se o número do WhatsApp do lead não puder receber mensagens (ex: ausente de rede ou inválido), o n8n envia:
```json
{
  "prospect_id": "UUID_DO_PROSPECT",
  "event_type": "automation_failed",
  "status": "failed",
  "message": "Falha no envio de mensagem via Evolution API: Número não registrado no WhatsApp.",
  "channel": "whatsapp",
  "n8n_execution_id": "exec-mock-12345"
}
```

### Cenário B: Pausado / Parado pelo Operador (paused / stopped)
Sempre que uma ação de pausa ou parada é solicitada na UI do MOTHERXIP, as APIs atualizam os registros e enviam timeline logs. O n8n é notificado ou consulta o status do banco para congelar/cancelar a execução ativa do fluxo de follow-ups.

### Cenário C: Webhook Duplicado (Idempotência)
Caso o n8n tente reenviar uma notificação devido a retries de rede, ele envia a mesma combinação de `n8n_execution_id` e `event_type`. O MOTHERXIP utiliza essa chave composta para ignorar o processamento duplicado, respondendo `200 OK` com `duplicate: true`.

---

## 3. SEGURANÇA E VALIDAÇÃO DE WEBHOOK

Para evitar injeções ou acionamentos de API não autorizados em produção, toda chamada enviada do n8n para o MOTHERXIP **deve** incluir a assinatura de segredo.

### Validação de Secret
No nó de requisição HTTP (HTTP Request) do n8n, adicione o seguinte Header de autenticação:
* **Header Name**: `x-motherxip-webhook-secret`
* **Header Value**: Valor definido na variável de ambiente `MOTHERXIP_WEBHOOK_SECRET`.

O endpoint `/api/outreach/events` valida a correspondência exata. Se o segredo estiver incorreto, retorna status `401 Unauthorized` e cria um log com o status `invalid_secret` na tabela `webhook_audit_logs`.

---

## 4. GUIA DE USO DO SANDBOX (HOMOLOGAÇÃO)

### Como Usar o Sandbox
1. Acesse o painel **Outreach Mission Control** em `/os/outreach`.
2. Alterne a chave de ambiente no canto superior direito para **🛠️ Sandbox**.
3. No **Prospects Pipeline** (`/os/prospects/pipeline`), selecione os leads que deseja testar.
4. Clique em **Enviar Leads** e escolha o ambiente **Sandbox / Homologação (Mock)** no modal de confirmação.
5. As automações disparadas gravarão a coluna `automation_source = 'sandbox'` no banco de dados, mantendo-as 100% isoladas dos fluxos produtivos.

### Como Evitar Produção Acidental
* No código do Next.js, as métricas e painéis do Mission Control da homepage filtram estritamente por `automation_source = 'production'` por padrão.
* O script de teste de carga (`scripts/simulate-load.mjs`) roda em modo Sandbox por padrão e exige a flag `--i-confirm-production-load-test` acompanhada da flag `--production` para atuar em produção, reduzindo a zero o risco de disparos acidentais para leads reais.

---

## 5. INTERPRETAÇÃO DOS AUDIT LOGS

A tabela técnica de auditoria (**Webhook Audit Logs**) na base do Outreach Center permite diagnosticar o fluxo técnico rapidamente.

| Status de Auditoria | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| **processed** | Webhook recebido, secret validado e timeline atualizado com sucesso. | Nenhuma. Tudo operacional. |
| **duplicate_ignored** | O webhook tentou retransmitir um evento que já foi gravado. Ignorado com sucesso. | Nenhuma. A idempotência funcionou corretamente. |
| **invalid_secret** | Uma requisição tentou bater no webhook sem o segredo correto. | Verificar se o n8n possui o header `x-motherxip-webhook-secret` correto. |
| **invalid_json** | O corpo do webhook não pôde ser parsed como JSON válido. | Verificar a formatação da chamada no n8n. |
| **missing_fields** | Parâmetros obrigatórios como `prospect_id` ou `status` vieram vazios. | Ajustar o payload de saída no nó HTTP do n8n. |
| **error** | Ocorreu um erro interno de banco de dados ou processamento. | Ler o campo `error_message` na tabela para identificar o erro de banco. |
