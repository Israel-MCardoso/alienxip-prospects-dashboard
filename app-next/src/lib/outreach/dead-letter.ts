export type DeadLetterSource = "callback" | "evolution" | "webhook" | "rate_limit" | "unknown";

export interface DeadLetterInput {
  payload: Record<string, unknown>;
  error: Error | string;
  source: DeadLetterSource;
  attempt: number;
}

export interface DeadLetterEntry extends DeadLetterInput {
  error: string;
  timestamp: string;
}

function sanitizeError(error: Error | string) {
  return String(error instanceof Error ? error.message : error).replace(/sk-[A-Za-z0-9_-]+/g, "sk-***redacted***");
}

export function createDeadLetter(input: DeadLetterInput): DeadLetterEntry {
  return {
    payload: input.payload,
    error: sanitizeError(input.error),
    source: input.source,
    attempt: input.attempt,
    timestamp: new Date().toISOString()
  };
}
