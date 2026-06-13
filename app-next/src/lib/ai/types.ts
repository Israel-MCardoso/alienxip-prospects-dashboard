export type AIProviderName = "mock" | "openai" | "claude" | "gemini";

export type LeadTemperature = "cold" | "warm" | "hot";
export type LeadFit = "strong" | "medium" | "weak" | "unknown";
export type DigitalMaturity = "low" | "medium" | "high" | "unknown";

export interface ProspectContext {
  id: string;
  name: string;
  segment?: string | null;
  city?: string | null;
  temperature?: LeadTemperature | string | null;
  priority_score?: number | null;
  website_url?: string | null;
  instagram_url?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
}

export interface DiagnosticsContext {
  website_notes?: string | null;
  instagram_notes?: string | null;
  whatsapp_notes?: string | null;
  google_business_notes?: string | null;
  diagnosis_summary?: string | null;
  opportunities?: string[] | null;
}

export interface ConversationContext {
  conversation_id?: string;
  prospect_id?: string;
  stage?: string;
  last_message?: string;
  history?: Array<{ role: "lead" | "sdr" | "system"; content: string }>;
}

export interface LeadAnalysisInput {
  prospect: ProspectContext;
  diagnostics?: DiagnosticsContext;
}

export interface LeadAnalysisResult {
  prospect_id: string;
  icp_fit: LeadFit;
  digital_maturity: DigitalMaturity;
  priority_score_suggestion?: number;
  opportunities: string[];
  risks: string[];
  recommended_stage: string;
  evidence: string[];
  needs_human_review: boolean;
}

export interface LeadQualificationInput extends LeadAnalysisInput {
  analysis?: LeadAnalysisResult;
}

export interface LeadQualificationResult {
  prospect_id: string;
  qualified: boolean;
  temperature: LeadTemperature;
  reason: string;
  missing_information: string[];
  next_action: "diagnose" | "follow_up" | "schedule_meeting" | "handoff_human" | "disqualify";
  needs_human_review: boolean;
}

export interface GenerateReplyInput {
  prospect: ProspectContext;
  conversation: ConversationContext;
}

export interface GenerateReplyResult {
  reply: string;
  intent: string;
  stage: string;
  confidence?: number;
  next_action: string;
  channel: "whatsapp" | "instagram" | "email" | "manual";
  handoff_required: boolean;
  needs_human_review: boolean;
}

export interface HandleObjectionInput {
  prospect: ProspectContext;
  objection: string;
  conversation?: ConversationContext;
}

export interface HandleObjectionResult {
  objection_type: string;
  recommended_reply: string;
  next_action: string;
  handoff_required: boolean;
  needs_human_review: boolean;
  reasoning_summary: string;
}

export interface MeetingDecisionInput {
  conversation: ConversationContext;
}

export interface MeetingDecisionResult {
  should_schedule: boolean;
  reason: string;
  confidence: number;
  suggested_meeting_title?: string;
  handoff_required: boolean;
  blocked_by: string[];
}

export interface ConversationSummaryInput {
  conversation_id: string;
  prospect_id: string;
  events: string[];
}

export interface ConversationSummaryResult {
  conversation_id: string;
  prospect_id: string;
  summary: string;
  lead_intent: string;
  next_action: string;
  risks: string[];
  important_facts: string[];
  needs_human_review: boolean;
}

export interface ProposalBriefInput {
  prospect: ProspectContext;
  diagnostics?: DiagnosticsContext;
  conversationSummary?: ConversationSummaryResult;
}

export interface ProposalBriefResult {
  prospect_id: string;
  title: string;
  problem_summary: string;
  recommended_scope: string[];
  pricing_reference?: string;
  evidence: string[];
  assumptions: string[];
  risks: string[];
  next_steps: string[];
  human_review_required: true;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
