import type { AIProvider } from "./provider";
import { estimateOpenAICost } from "./cost-engine";
import { MockAIProvider } from "./mock-provider";
import { loadPrompt, type PromptKey } from "./prompts";
import { ensureAIResult, type AISchemaName } from "./schemas";
import { trackAIUsage } from "./usage-tracker";
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

export interface OpenAIProviderOptions {
  model?: string;
}

function estimateTokens(value: unknown) {
  const serialized = JSON.stringify(value ?? "");
  return Math.max(1, Math.ceil(serialized.length / 4));
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly enabled = false;
  readonly model: string;
  private readonly fallback = new MockAIProvider();

  constructor(options: OpenAIProviderOptions = {}) {
    this.model = options.model || "gpt-4.1-mini";
  }

  private recordDryRunUsage(feature: string, promptKey: PromptKey, input: unknown, output: unknown, conversationId?: string) {
    const prompt = loadPrompt(promptKey);
    const estimatedInputTokens = estimateTokens({ prompt: prompt.content, input });
    const estimatedOutputTokens = estimateTokens(output);
    const potentialCost = estimateOpenAICost({
      model: this.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens
    });

    trackAIUsage({
      provider: "openai",
      model: this.model,
      feature,
      estimated_input_tokens: estimatedInputTokens,
      estimated_output_tokens: estimatedOutputTokens,
      estimated_cost: 0,
      conversation_id: conversationId
    });

    return potentialCost;
  }

  private finalize<T>(schema: AISchemaName, feature: string, promptKey: PromptKey, input: unknown, output: T, fallback: T, conversationId?: string) {
    this.recordDryRunUsage(feature, promptKey, input, output, conversationId);
    return ensureAIResult(schema, output, fallback);
  }

  async analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysisResult> {
    const output = await this.fallback.analyzeLead(input);
    const fallback = await this.fallback.analyzeLead({
      prospect: { id: input.prospect.id, name: input.prospect.name },
      diagnostics: input.diagnostics
    });
    return this.finalize("LeadAnalysis", "analyzeLead", "lead-analyzer", input, output, fallback);
  }

  async qualifyLead(input: LeadQualificationInput): Promise<LeadQualificationResult> {
    const output = await this.fallback.qualifyLead(input);
    const fallback = await this.fallback.qualifyLead({ prospect: input.prospect, diagnostics: input.diagnostics });
    return this.finalize("LeadQualification", "qualifyLead", "lead-analyzer", input, output, fallback);
  }

  async generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const output = await this.fallback.generateReply(input);
    const fallback = await this.fallback.generateReply({
      prospect: input.prospect,
      conversation: { ...input.conversation, last_message: input.conversation.last_message || "" }
    });
    return this.finalize("GenerateReply", "generateSDRReply", "sdr", input, output, fallback, input.conversation.conversation_id);
  }

  async generateSDRReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    return this.generateReply(input);
  }

  async handleObjection(input: HandleObjectionInput): Promise<HandleObjectionResult> {
    const output = await this.fallback.handleObjection(input);
    const fallback = await this.fallback.handleObjection({ ...input, objection: input.objection || "Objecao sem contexto." });
    return this.finalize("HandleObjection", "handleObjection", "objections", input, output, fallback, input.conversation?.conversation_id);
  }

  async decideMeeting(input: MeetingDecisionInput): Promise<MeetingDecisionResult> {
    const output = await this.fallback.decideMeeting(input);
    const fallback = await this.fallback.decideMeeting({ conversation: { ...input.conversation, last_message: input.conversation.last_message || "" } });
    return this.finalize("MeetingDecision", "decideMeeting", "scheduler", input, output, fallback, input.conversation.conversation_id);
  }

  async generateConversationSummary(input: ConversationSummaryInput): Promise<ConversationSummaryResult> {
    const output = await this.fallback.generateConversationSummary(input);
    const fallback = await this.fallback.generateConversationSummary({ ...input, events: input.events || [] });
    return this.finalize("ConversationSummary", "generateConversationSummary", "sdr", input, output, fallback, input.conversation_id);
  }

  async generateProposalBrief(input: ProposalBriefInput): Promise<ProposalBriefResult> {
    const output = await this.fallback.generateProposalBrief(input);
    const fallback = await this.fallback.generateProposalBrief({ prospect: input.prospect, diagnostics: input.diagnostics });
    return this.finalize("ProposalBrief", "generateProposalBrief", "proposal-builder", input, output, fallback);
  }
}
