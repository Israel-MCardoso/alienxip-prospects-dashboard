# ALIENXIP AI BRAIN Architecture

Data: 2026-06-12  
Status: arquitetura preparada, providers desligados  
Provider principal futuro planejado: OpenAI com `gpt-4.1-mini`  

## Objetivo

O ALIENXIP AI BRAIN sera a camada unica de inteligencia comercial da ALIENXIP. Ele deve orquestrar diagnostico, qualificacao, SDR, objecoes, agendamento, handoff humano, resumo de conversa e brief de proposta sem espalhar prompts, regras ou chamadas de provider pelas rotas da aplicacao.

Esta preparacao nao ativa IA real, nao chama OpenAI, nao consome creditos, nao altera workflow produtivo e nao conecta Evolution API ou WhatsApp real.

## Principios

1. Uma entrada unica para IA: `ALIENXIP AI BRAIN`.
2. Providers desacoplados por interface `AIProvider`.
3. Provider real sempre desligado por padrao.
4. Toda saida deve obedecer schemas JSON versionados.
5. Prompts devem usar apenas metodologia ALIENXIP aprovada.
6. Budget guard deve bloquear chamadas antes do provider.
7. Callback n8n nao deve chamar IA sem fila, budget e idempotencia.
8. Proposta final exige revisao humana.

## Metodologia Obrigatoria

O AI Brain deve seguir os blocos comerciais existentes:

- Lead Analyzer;
- SDR PRO;
- Proposal Builder;
- Framework de Missoes;
- ICPs;
- Pricing Engine;
- Playbook Comercial;
- Base de Objecoes.

Fontes locais atuais:

- `wiki_pages` publicadas e aprovadas;
- `playbooks` publicados e aprovados;
- `prospects`;
- `prospect_diagnostics`;
- `prospect_notes`;
- `prospect_outreach`;
- `outreach_events`;
- `prospect_proposals`;
- `commercial_tasks`.

Se a metodologia nao estiver documentada na base, o AI Brain deve retornar `needs_human_review=true` em vez de inventar processo.

## Responsabilidades

| Responsabilidade | Entrada | Saida |
| --- | --- | --- |
| Diagnostico | Prospect, diagnostico digital, canais, notas | `LeadAnalysis` |
| Qualificacao | Prospect, ICP, prioridade, contexto comercial | `LeadQualification` |
| SDR | Estado de conversa, playbook, objecoes | resposta estruturada |
| Objecoes | Mensagem do lead, base de objecoes, etapa do funil | resposta e proxima acao |
| Agendamento | Intencao, disponibilidade futura, temperatura | `MeetingDecision` |
| Handoff humano | Risco, pedido complexo, proposta, objeccao critica | tarefa/alerta |
| Resumo | Eventos de conversa e timeline | `ConversationSummary` |
| Proposta | Diagnostico, pricing, escopo, decisao comercial | `ProposalBrief` |

## Fluxo Conceitual

```txt
Route ou n8n event
-> AI Brain Orchestrator
-> Safety Gate
-> Budget Guard
-> Prompt Registry
-> JSON Schema Contract
-> AIProvider desativado por padrao
-> resposta validada
-> persistencia/auditoria futura
```

## Provider Layer

Interface planejada:

```ts
export interface AIProvider {
  readonly name: "openai" | "claude" | "gemini";
  readonly enabled: boolean;
  analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysis>;
  qualifyLead(input: LeadQualificationInput): Promise<LeadQualification>;
  handleObjection(input: ObjectionInput): Promise<ObjectionResponse>;
  generateReply(input: ReplyInput): Promise<GeneratedReply>;
  generateSummary(input: SummaryInput): Promise<ConversationSummary>;
  generateProposalBrief(input: ProposalBriefInput): Promise<ProposalBrief>;
}
```

Implementacoes futuras:

- `OpenAIProvider`: provider principal futuro, modelo default `gpt-4.1-mini`, desligado.
- `ClaudeProvider`: provider alternativo futuro, desligado.
- `GeminiProvider`: provider alternativo futuro, desligado.

Comportamento enquanto desligado:

- nao instanciar SDK externo;
- nao ler chave secreta fora do servidor;
- nao enviar request HTTP;
- retornar erro controlado `PROVIDER_DISABLED`;
- registrar zero custo;
- permitir testes unitarios com mock provider local.

## Safety Gate

Antes de qualquer chamada futura, o AI Brain deve validar:

- `PROVIDER_ENABLED=true`;
- provider permitido;
- modelo permitido;
- `OPENAI_API_KEY` presente apenas no ambiente server-side;
- `MAX_COST_PER_CONVERSATION` nao excedido;
- `MAX_DAILY_COST` nao excedido;
- prompt versionado;
- schema de saida selecionado;
- contexto sem segredo ou dado sensivel desnecessario;
- lead nao marcado como opt-out, stopped ou do-not-contact.

## Budget Guard

Variaveis planejadas, sempre desligadas por padrao:

```env
PROVIDER_ENABLED=false
OPENAI_API_KEY=
OPENAI_SDR_MODEL=gpt-4.1-mini
MAX_COST_PER_CONVERSATION=0
MAX_DAILY_COST=0
AI_DRY_RUN=true
```

## Persistencia Futura

Tabela planejada, migration nao aplicada:

- `ai_usage_logs`

Campos:

- `provider`
- `model`
- `tokens_input`
- `tokens_output`
- `cost`
- `conversation_id`
- `created_at`

## Integracao com n8n

O sandbox atual permanece intocado. Futuramente:

1. n8n continua responsavel por orquestracao operacional.
2. AI Brain gera decisao/mensagem antes do envio real.
3. Evolution API so entra em workflow separado de producao.
4. Callback de eventos atualiza estado e pode disparar resumo assíncrono, nunca chamada direta sem budget.

## Nao Escopo

- Ativar provider real.
- Criar chave OpenAI.
- Aplicar migration.
- Chamar OpenAI, Claude ou Gemini.
- Enviar WhatsApp real.
- Conectar Evolution API.
- Alterar CRM produtivo.
- Alterar workflow n8n produtivo.
