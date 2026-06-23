export interface RetryDecisionInput {
  failedAttempt: number;
  maxAttempts?: number;
  baseDelaySeconds?: number;
}

export type RetryDecision =
  | { action: "retry"; nextAttempt: number; delayMs: number }
  | { action: "dead_letter"; nextAttempt: number; delayMs: 0 };

export function getRetryDecision(input: RetryDecisionInput): RetryDecision {
  const maxAttempts = input.maxAttempts ?? 3;
  const baseDelaySeconds = input.baseDelaySeconds ?? 30;
  const failedAttempt = Math.max(1, input.failedAttempt);

  if (failedAttempt >= maxAttempts) {
    return { action: "dead_letter", nextAttempt: failedAttempt, delayMs: 0 };
  }

  return {
    action: "retry",
    nextAttempt: failedAttempt + 1,
    delayMs: baseDelaySeconds * (2 ** (failedAttempt - 1)) * 1000
  };
}

export const RETRY_PROFILES = {
  callback: { maxAttempts: 3, baseDelaySeconds: 30 },
  evolution: { maxAttempts: 3, baseDelaySeconds: 30 },
  webhook: { maxAttempts: 3, baseDelaySeconds: 30 }
} as const;
