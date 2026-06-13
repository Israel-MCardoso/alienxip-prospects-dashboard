import type {
  ConversationSummaryResult,
  GenerateReplyResult,
  HandleObjectionResult,
  LeadAnalysisResult,
  LeadQualificationResult,
  MeetingDecisionResult,
  ProposalBriefResult,
  ValidationResult
} from "./types";

function requireString(value: unknown, field: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) errors.push(`${field} must be a non-empty string`);
}

function requireBoolean(value: unknown, field: string, errors: string[]) {
  if (typeof value !== "boolean") errors.push(`${field} must be boolean`);
}

function requireArray(value: unknown, field: string, errors: string[]) {
  if (!Array.isArray(value)) errors.push(`${field} must be an array`);
}

function requireEnum(value: unknown, field: string, values: string[], errors: string[]) {
  if (typeof value !== "string" || !values.includes(value)) errors.push(`${field} must be one of ${values.join(", ")}`);
}

export function validateLeadAnalysis(value: LeadAnalysisResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.prospect_id, "prospect_id", errors);
  requireEnum(value.icp_fit, "icp_fit", ["strong", "medium", "weak", "unknown"], errors);
  requireEnum(value.digital_maturity, "digital_maturity", ["low", "medium", "high", "unknown"], errors);
  requireArray(value.opportunities, "opportunities", errors);
  requireArray(value.risks, "risks", errors);
  requireString(value.recommended_stage, "recommended_stage", errors);
  requireBoolean(value.needs_human_review, "needs_human_review", errors);
  if (value.priority_score_suggestion !== undefined) {
    const score = value.priority_score_suggestion;
    if (!Number.isInteger(score) || score < 0 || score > 100) errors.push("priority_score_suggestion must be 0..100");
  }
  return { valid: errors.length === 0, errors };
}

export function validateLeadQualification(value: LeadQualificationResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.prospect_id, "prospect_id", errors);
  requireBoolean(value.qualified, "qualified", errors);
  requireEnum(value.temperature, "temperature", ["cold", "warm", "hot"], errors);
  requireString(value.reason, "reason", errors);
  requireArray(value.missing_information, "missing_information", errors);
  requireEnum(value.next_action, "next_action", ["diagnose", "follow_up", "schedule_meeting", "handoff_human", "disqualify"], errors);
  requireBoolean(value.needs_human_review, "needs_human_review", errors);
  return { valid: errors.length === 0, errors };
}

export function validateGenerateReply(value: GenerateReplyResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.reply, "reply", errors);
  requireString(value.intent, "intent", errors);
  requireString(value.stage, "stage", errors);
  requireString(value.next_action, "next_action", errors);
  requireEnum(value.channel, "channel", ["whatsapp", "instagram", "email", "manual"], errors);
  requireBoolean(value.handoff_required, "handoff_required", errors);
  requireBoolean(value.needs_human_review, "needs_human_review", errors);
  if (value.confidence !== undefined && (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1)) {
    errors.push("confidence must be between 0 and 1");
  }
  return { valid: errors.length === 0, errors };
}

export function validateHandleObjection(value: HandleObjectionResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.objection_type, "objection_type", errors);
  requireString(value.recommended_reply, "recommended_reply", errors);
  requireString(value.next_action, "next_action", errors);
  requireBoolean(value.handoff_required, "handoff_required", errors);
  requireBoolean(value.needs_human_review, "needs_human_review", errors);
  requireString(value.reasoning_summary, "reasoning_summary", errors);
  return { valid: errors.length === 0, errors };
}

export function validateMeetingDecision(value: MeetingDecisionResult): ValidationResult {
  const errors: string[] = [];
  requireBoolean(value.should_schedule, "should_schedule", errors);
  requireString(value.reason, "reason", errors);
  if (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }
  requireBoolean(value.handoff_required, "handoff_required", errors);
  requireArray(value.blocked_by, "blocked_by", errors);
  return { valid: errors.length === 0, errors };
}

export function validateProposalBrief(value: ProposalBriefResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.prospect_id, "prospect_id", errors);
  requireString(value.title, "title", errors);
  requireString(value.problem_summary, "problem_summary", errors);
  requireArray(value.recommended_scope, "recommended_scope", errors);
  requireArray(value.evidence, "evidence", errors);
  requireArray(value.assumptions, "assumptions", errors);
  requireArray(value.risks, "risks", errors);
  if (value.human_review_required !== true) errors.push("human_review_required must be true");
  return { valid: errors.length === 0, errors };
}

export function validateConversationSummary(value: ConversationSummaryResult): ValidationResult {
  const errors: string[] = [];
  requireString(value.conversation_id, "conversation_id", errors);
  requireString(value.prospect_id, "prospect_id", errors);
  requireString(value.summary, "summary", errors);
  requireString(value.lead_intent, "lead_intent", errors);
  requireString(value.next_action, "next_action", errors);
  requireArray(value.risks, "risks", errors);
  requireArray(value.important_facts, "important_facts", errors);
  requireBoolean(value.needs_human_review, "needs_human_review", errors);
  return { valid: errors.length === 0, errors };
}

export type AISchemaName =
  | "LeadAnalysis"
  | "LeadQualification"
  | "ConversationState"
  | "MeetingDecision"
  | "ProposalBrief"
  | "ConversationSummary"
  | "GenerateReply"
  | "HandleObjection";

export function validateAIResult(schema: AISchemaName, value: unknown): ValidationResult {
  switch (schema) {
    case "LeadAnalysis":
      return validateLeadAnalysis(value as LeadAnalysisResult);
    case "LeadQualification":
      return validateLeadQualification(value as LeadQualificationResult);
    case "ConversationState":
    case "GenerateReply":
      return validateGenerateReply(value as GenerateReplyResult);
    case "HandleObjection":
      return validateHandleObjection(value as HandleObjectionResult);
    case "MeetingDecision":
      return validateMeetingDecision(value as MeetingDecisionResult);
    case "ProposalBrief":
      return validateProposalBrief(value as ProposalBriefResult);
    case "ConversationSummary":
      return validateConversationSummary(value as ConversationSummaryResult);
    default:
      return { valid: false, errors: [`Unknown schema: ${schema}`] };
  }
}

export function ensureAIResult<T>(schema: AISchemaName, value: T, fallback: T): T {
  const validation = validateAIResult(schema, value);
  if (validation.valid) return value;

  console.error(`AI schema validation failed for ${schema}: ${validation.errors.join("; ")}`);
  return fallback;
}
