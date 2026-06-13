import type { AIProvider } from "./provider";
import type {
  ConversationSummaryInput,
  ConversationSummaryResult,
  GenerateReplyInput,
  GenerateReplyResult,
  HandleObjectionInput,
  HandleObjectionResult,
  LeadAnalysisInput,
  LeadAnalysisResult,
  LeadQualificationInput,
  LeadQualificationResult,
  MeetingDecisionInput,
  MeetingDecisionResult,
  ProposalBriefInput,
  ProposalBriefResult
} from "./types";

function textIncludes(text: string | undefined, patterns: string[]) {
  const normalized = (text || "").toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

function prospectHasDigitalSignals(input: LeadAnalysisInput) {
  const prospect = input.prospect;
  const diagnostics = input.diagnostics;
  return Boolean(
    prospect.website_url ||
    prospect.instagram_url ||
    diagnostics?.website_notes ||
    diagnostics?.instagram_notes ||
    diagnostics?.whatsapp_notes
  );
}

function inferOpportunities(input: LeadAnalysisInput) {
  const opportunities = new Set<string>();
  const diagnostics = input.diagnostics;

  if (diagnostics?.website_notes || input.prospect.website_url) {
    opportunities.add("Diagnostico de website, velocidade, UX mobile e CTA.");
  }
  if (diagnostics?.instagram_notes || input.prospect.instagram_url) {
    opportunities.add("Ajuste de posicionamento e clareza de oferta no Instagram.");
  }
  if (diagnostics?.whatsapp_notes || input.prospect.whatsapp) {
    opportunities.add("Melhoria de atendimento e cadencia consultiva via WhatsApp.");
  }
  if (opportunities.size === 0) {
    opportunities.add("Coletar dados de presenca digital antes de recomendar escopo.");
  }

  return Array.from(opportunities);
}

function inferObjectionType(objection: string) {
  if (textIncludes(objection, ["caro", "preco", "valor", "orçamento", "orcamento"])) return "price_objection";
  if (textIncludes(objection, ["fornecedor", "agencia", "agência"])) return "has_vendor";
  if (textIncludes(objection, ["sem interesse", "nao tenho interesse", "não tenho interesse"])) return "not_interested";
  if (textIncludes(objection, ["depois", "outro momento", "mais tarde"])) return "follow_up_later";
  return "general_objection";
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly enabled = true;

  async analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysisResult> {
    const hasSignals = prospectHasDigitalSignals(input);
    const priority = input.prospect.priority_score ?? 50;
    const segment = (input.prospect.segment || "").toLowerCase();
    const icpFit = segment.includes("clinica") || segment.includes("odont") || priority >= 70 ? "strong" : "medium";

    return {
      prospect_id: input.prospect.id,
      icp_fit: hasSignals ? icpFit : "unknown",
      digital_maturity: hasSignals ? "medium" : "unknown",
      priority_score_suggestion: Math.max(0, Math.min(100, Math.round(priority))),
      opportunities: inferOpportunities(input),
      risks: hasSignals ? [] : ["Faltam dados digitais suficientes para recomendacao sem revisao humana."],
      recommended_stage: hasSignals ? "diagnostico" : "follow_up",
      evidence: [
        input.prospect.segment ? `Segmento informado: ${input.prospect.segment}` : "Segmento nao informado.",
        input.prospect.city ? `Cidade informada: ${input.prospect.city}` : "Cidade nao informada."
      ],
      needs_human_review: !hasSignals
    };
  }

  async qualifyLead(input: LeadQualificationInput): Promise<LeadQualificationResult> {
    const analysis = input.analysis ?? await this.analyzeLead(input);
    const qualified = analysis.icp_fit === "strong" || analysis.icp_fit === "medium";
    return {
      prospect_id: input.prospect.id,
      qualified,
      temperature: qualified ? "warm" : "cold",
      reason: qualified
        ? "Lead possui sinais suficientes para diagnostico consultivo ALIENXIP."
        : "Lead precisa de mais contexto antes de avancar.",
      missing_information: analysis.needs_human_review ? ["diagnostico_digital", "contexto_de_decisor"] : [],
      next_action: qualified ? "diagnose" : "follow_up",
      needs_human_review: analysis.needs_human_review
    };
  }

  async generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const lastMessage = input.conversation.last_message || "";
    const wantsProposal = textIncludes(lastMessage, ["proposta", "valor", "preco", "preço"]);
    const wantsMeeting = textIncludes(lastMessage, ["reuniao", "reunião", "agenda", "agendar"]);

    return {
      reply: wantsMeeting
        ? "Perfeito. Podemos usar um diagnostico rapido para entender sua operacao digital e indicar os proximos passos com clareza. Qual melhor periodo para falarmos?"
        : "Legal. Antes de falar em escopo, faz sentido entendermos rapidamente sua presenca digital, canais atuais e objetivo comercial. Assim a recomendacao fica mais precisa para sua operacao.",
      intent: wantsMeeting ? "wants_meeting" : wantsProposal ? "wants_proposal_context" : "interested",
      stage: wantsMeeting ? "negotiating" : "replied",
      confidence: wantsMeeting ? 0.86 : 0.74,
      next_action: wantsMeeting ? "schedule_meeting" : "continue_diagnosis",
      channel: "whatsapp",
      handoff_required: wantsProposal,
      needs_human_review: wantsProposal
    };
  }

  async generateSDRReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    return this.generateReply(input);
  }

  async handleObjection(input: HandleObjectionInput): Promise<HandleObjectionResult> {
    const objectionType = inferObjectionType(input.objection);
    if (objectionType === "price_objection") {
      return {
        objection_type: objectionType,
        recommended_reply: "Entendo. O valor depende do escopo real da operacao, por isso a ALIENXIP prefere fazer um diagnostico rapido antes de sugerir qualquer caminho. Assim evitamos propor algo maior ou menor do que voce precisa.",
        next_action: "handoff_human",
        handoff_required: true,
        needs_human_review: true,
        reasoning_summary: "Objecao de preco exige contexto de escopo e revisao humana antes de condicao comercial."
      };
    }

    return {
      objection_type: objectionType,
      recommended_reply: "Entendo perfeitamente. Posso deixar um diagnostico rapido como referencia e, se fizer sentido depois, seguimos sem pressa.",
      next_action: objectionType === "not_interested" ? "disqualify" : "follow_up",
      handoff_required: false,
      needs_human_review: objectionType === "general_objection",
      reasoning_summary: "Resposta consultiva baseada no playbook, sem pressao comercial."
    };
  }

  async decideMeeting(input: MeetingDecisionInput): Promise<MeetingDecisionResult> {
    const lastMessage = input.conversation.last_message || "";
    const clearIntent = textIncludes(lastMessage, ["agendar", "reuniao", "reunião", "proposta", "diagnostico", "diagnóstico"]);
    const negativeIntent = textIncludes(lastMessage, ["sem interesse", "nao tenho interesse", "não tenho interesse", "pare", "parar"]);

    if (clearIntent && !negativeIntent) {
      return {
        should_schedule: true,
        reason: "Lead demonstrou intencao clara de avancar para diagnostico ou proposta.",
        confidence: 0.86,
        suggested_meeting_title: "Diagnostico Digital ALIENXIP",
        handoff_required: false,
        blocked_by: []
      };
    }

    return {
      should_schedule: false,
      reason: negativeIntent ? "Lead indicou falta de interesse ou bloqueio." : "Ainda nao ha intencao clara de reuniao.",
      confidence: negativeIntent ? 0.9 : 0.62,
      handoff_required: negativeIntent,
      blocked_by: negativeIntent ? ["negative_intent"] : ["missing_clear_intent"]
    };
  }

  async generateConversationSummary(input: ConversationSummaryInput): Promise<ConversationSummaryResult> {
    const joined = input.events.join(" ");
    const wantsMeeting = textIncludes(joined, ["agendar", "reuniao", "reunião", "diagnostico"]);
    return {
      conversation_id: input.conversation_id,
      prospect_id: input.prospect_id,
      summary: input.events.length > 0
        ? `Conversa com ${input.events.length} eventos resumida em modo mock.`
        : "Sem eventos suficientes para resumo detalhado.",
      lead_intent: wantsMeeting ? "wants_meeting" : "needs_follow_up",
      next_action: wantsMeeting ? "schedule_meeting" : "follow_up",
      risks: [],
      important_facts: input.events.slice(0, 5),
      needs_human_review: input.events.length === 0
    };
  }

  async generateProposalBrief(input: ProposalBriefInput): Promise<ProposalBriefResult> {
    const opportunities = inferOpportunities({ prospect: input.prospect, diagnostics: input.diagnostics });
    return {
      prospect_id: input.prospect.id,
      title: `Brief de proposta - ${input.prospect.name}`,
      problem_summary: input.diagnostics?.diagnosis_summary || "Brief gerado em mock a partir dos sinais digitais e conversa comercial.",
      recommended_scope: opportunities,
      pricing_reference: "Usar Pricing Engine aprovado antes de apresentar valor.",
      evidence: [
        input.prospect.segment ? `Segmento: ${input.prospect.segment}` : "Segmento pendente.",
        input.conversationSummary?.summary || "Resumo de conversa ainda nao anexado."
      ],
      assumptions: ["Escopo e valores exigem validacao humana antes de envio."],
      risks: ["Nao enviar proposta final automaticamente."],
      next_steps: ["Revisar brief", "Validar escopo", "Aplicar Pricing Engine", "Preparar proposta humana"],
      human_review_required: true
    };
  }
}
