"use server";

import { getAIProvider } from "@/lib/ai/index";
import type {
  DiagnosticsContext,
  GenerateReplyResult,
  HandleObjectionResult,
  LeadAnalysisResult,
  LeadQualificationResult,
  MeetingDecisionResult,
  ProposalBriefResult,
  ProspectContext
} from "@/lib/ai/index";

export interface AiSandboxInput {
  prospect: ProspectContext;
  diagnostic?: DiagnosticsContext | null;
  message?: string;
  objection?: string;
}

export interface AiSandboxResponse<T> {
  provider: "mock";
  mode: "sandbox";
  cost: 0;
  result: T;
}

function sandboxResponse<T>(result: T): AiSandboxResponse<T> {
  return {
    provider: "mock",
    mode: "sandbox",
    cost: 0,
    result
  };
}

function normalizeDiagnostic(diagnostic?: DiagnosticsContext | null): DiagnosticsContext | undefined {
  if (!diagnostic) return undefined;
  return {
    website_notes: diagnostic.website_notes ?? null,
    instagram_notes: diagnostic.instagram_notes ?? null,
    whatsapp_notes: diagnostic.whatsapp_notes ?? null,
    google_business_notes: diagnostic.google_business_notes ?? null,
    diagnosis_summary: diagnostic.diagnosis_summary ?? null,
    opportunities: Array.isArray(diagnostic.opportunities) ? diagnostic.opportunities : null
  };
}

export async function analyzeLeadSandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<LeadAnalysisResult>> {
  const provider = getAIProvider();
  const result = await provider.analyzeLead({
    prospect: input.prospect,
    diagnostics: normalizeDiagnostic(input.diagnostic)
  });
  return sandboxResponse(result);
}

export async function qualifyLeadSandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<LeadQualificationResult>> {
  const provider = getAIProvider();
  const analysis = await provider.analyzeLead({
    prospect: input.prospect,
    diagnostics: normalizeDiagnostic(input.diagnostic)
  });
  const result = await provider.qualifyLead({
    prospect: input.prospect,
    diagnostics: normalizeDiagnostic(input.diagnostic),
    analysis
  });
  return sandboxResponse(result);
}

export async function generateReplySandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<GenerateReplyResult>> {
  const provider = getAIProvider();
  const result = await provider.generateReply({
    prospect: input.prospect,
    conversation: {
      conversation_id: `sandbox-${input.prospect.id}`,
      prospect_id: input.prospect.id,
      stage: "replied",
      last_message: input.message || ""
    }
  });
  return sandboxResponse(result);
}

export async function handleObjectionSandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<HandleObjectionResult>> {
  const provider = getAIProvider();
  const result = await provider.handleObjection({
    prospect: input.prospect,
    objection: input.objection || "",
    conversation: {
      conversation_id: `sandbox-${input.prospect.id}`,
      prospect_id: input.prospect.id,
      stage: "negotiating"
    }
  });
  return sandboxResponse(result);
}

export async function decideMeetingSandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<MeetingDecisionResult>> {
  const provider = getAIProvider();
  const result = await provider.decideMeeting({
    conversation: {
      conversation_id: `sandbox-${input.prospect.id}`,
      prospect_id: input.prospect.id,
      stage: "negotiating",
      last_message: input.message || ""
    }
  });
  return sandboxResponse(result);
}

export async function generateProposalBriefSandboxAction(input: AiSandboxInput): Promise<AiSandboxResponse<ProposalBriefResult>> {
  const provider = getAIProvider();
  const summary = await provider.generateConversationSummary({
    conversation_id: `sandbox-${input.prospect.id}`,
    prospect_id: input.prospect.id,
    events: [
      input.message || "Conversa sandbox sem mensagem manual.",
      input.diagnostic?.diagnosis_summary || "Diagnostico digital ainda em revisao."
    ]
  });
  const result = await provider.generateProposalBrief({
    prospect: input.prospect,
    diagnostics: normalizeDiagnostic(input.diagnostic),
    conversationSummary: summary
  });
  return sandboxResponse(result);
}
