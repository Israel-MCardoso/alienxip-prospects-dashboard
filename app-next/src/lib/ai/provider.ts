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
import { assertBudgetAllowed } from "./cost-guard";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";

export interface AIProvider {
  readonly name: string;
  readonly enabled: boolean;
  analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysisResult>;
  qualifyLead(input: LeadQualificationInput): Promise<LeadQualificationResult>;
  generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult>;
  generateSDRReply(input: GenerateReplyInput): Promise<GenerateReplyResult>;
  handleObjection(input: HandleObjectionInput): Promise<HandleObjectionResult>;
  decideMeeting(input: MeetingDecisionInput): Promise<MeetingDecisionResult>;
  generateConversationSummary(input: ConversationSummaryInput): Promise<ConversationSummaryResult>;
  generateProposalBrief(input: ProposalBriefInput): Promise<ProposalBriefResult>;
}

export interface ProviderFactoryOptions {
  env?: Record<string, string | undefined>;
}

function flagIsTrue(value: string | undefined) {
  return value?.toLowerCase() === "true";
}

function hasOpenAIKey(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function getAIProvider(options: ProviderFactoryOptions = {}): AIProvider {
  const env = options.env ?? process.env;
  const providerEnabled = flagIsTrue(env.PROVIDER_ENABLED);
  const dryRun = flagIsTrue(env.AI_DRY_RUN);

  if (!providerEnabled || dryRun || !hasOpenAIKey(env.OPENAI_API_KEY)) {
    return new MockAIProvider();
  }

  try {
    assertBudgetAllowed({ provider: "openai", estimatedCost: 0.000001, env });
  } catch {
    return new MockAIProvider();
  }

  return new OpenAIProvider({ model: env.OPENAI_SDR_MODEL || "gpt-4.1-mini" });
}
