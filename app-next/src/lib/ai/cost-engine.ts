export type OpenAIModel = "gpt-4.1-mini";

export interface ModelPricing {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  currency: "USD";
  note: string;
}

export const AI_MODEL_PRICING: Record<OpenAIModel, ModelPricing> = {
  "gpt-4.1-mini": {
    inputUsdPerMillionTokens: 0.4,
    outputUsdPerMillionTokens: 1.6,
    currency: "USD",
    note: "Central estimate for future activation. Reconfirm official OpenAI pricing before enabling production."
  }
};

export interface EstimateOpenAICostInput {
  model?: OpenAIModel | string;
  inputTokens: number;
  outputTokens: number;
}

function normalizeTokens(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value);
}

export function estimateOpenAICost(input: EstimateOpenAICostInput) {
  const model = (input.model || "gpt-4.1-mini") as OpenAIModel;
  const pricing = AI_MODEL_PRICING[model] ?? AI_MODEL_PRICING["gpt-4.1-mini"];
  const inputTokens = normalizeTokens(input.inputTokens);
  const outputTokens = normalizeTokens(input.outputTokens);
  const inputCost = inputTokens / 1_000_000 * pricing.inputUsdPerMillionTokens;
  const outputCost = outputTokens / 1_000_000 * pricing.outputUsdPerMillionTokens;

  return Number((inputCost + outputCost).toFixed(8));
}
