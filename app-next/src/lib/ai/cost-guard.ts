export interface BudgetGuardInput {
  provider: "mock" | "openai" | "claude" | "gemini";
  estimatedCost?: number;
  env?: Record<string, string | undefined>;
}

function isEnabled(value: string | undefined) {
  return value?.toLowerCase() === "true";
}

function numberFromEnv(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function assertBudgetAllowed(input: BudgetGuardInput) {
  if (input.provider === "mock") return;

  const env = input.env ?? process.env;
  const providerEnabled = isEnabled(env.PROVIDER_ENABLED);
  const dryRun = isEnabled(env.AI_DRY_RUN);
  const maxConversationCost = numberFromEnv(env.MAX_COST_PER_CONVERSATION);
  const maxDailyCost = numberFromEnv(env.MAX_DAILY_COST);
  const estimatedCost = input.estimatedCost ?? 0;
  const openAIKey = env.OPENAI_API_KEY?.trim();
  const blockers: string[] = [];

  if (!providerEnabled) blockers.push("PROVIDER_ENABLED=false");
  if (dryRun) blockers.push("AI_DRY_RUN=true");
  if (maxConversationCost <= 0) blockers.push("MAX_COST_PER_CONVERSATION=0");
  if (maxDailyCost <= 0) blockers.push("MAX_DAILY_COST=0");
  if (input.provider === "openai" && !openAIKey) blockers.push("OPENAI_API_KEY missing");
  if (estimatedCost > maxConversationCost) blockers.push("estimated cost exceeds conversation budget");

  if (blockers.length > 0) {
    throw new Error(`Real AI provider blocked by budget guard: ${blockers.join(", ")}`);
  }
}

export function realProviderIsBlocked(env: Record<string, string | undefined> = process.env) {
  try {
    assertBudgetAllowed({ provider: "openai", estimatedCost: 0.000001, env });
    return false;
  } catch {
    return true;
  }
}
