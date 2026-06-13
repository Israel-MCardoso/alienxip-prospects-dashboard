import type { AIProviderName } from "./types";

export interface AIUsageLog {
  timestamp: string;
  provider: AIProviderName;
  model: string;
  feature: string;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost: number;
  conversation_id?: string;
}

export type TrackAIUsageInput = Omit<AIUsageLog, "timestamp">;

const usageLogs: AIUsageLog[] = [];

function normalizeCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.ceil(value);
}

export function trackAIUsage(input: TrackAIUsageInput): AIUsageLog {
  const log: AIUsageLog = {
    timestamp: new Date().toISOString(),
    provider: input.provider,
    model: input.model,
    feature: input.feature,
    estimated_input_tokens: normalizeCount(input.estimated_input_tokens),
    estimated_output_tokens: normalizeCount(input.estimated_output_tokens),
    estimated_cost: Math.max(0, Number(input.estimated_cost) || 0),
    conversation_id: input.conversation_id
  };

  usageLogs.push(log);
  return log;
}

export function getAIUsageLogs() {
  return [...usageLogs];
}

export function clearAIUsageLogs() {
  usageLogs.length = 0;
}
