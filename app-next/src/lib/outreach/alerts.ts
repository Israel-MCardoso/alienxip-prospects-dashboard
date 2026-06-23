export type OperationalAlertType =
  | "invalid_webhook"
  | "evolution_offline"
  | "retry_exceeded"
  | "dead_letter_created"
  | "lead_stuck_72h";

export type OperationalAlertSeverity = "info" | "warning" | "critical";

export interface OperationalAlertInput {
  type: OperationalAlertType;
  severity: OperationalAlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface OperationalAlert extends OperationalAlertInput {
  created_at: string;
  delivered: false;
}

export function createOperationalAlert(input: OperationalAlertInput): OperationalAlert {
  return {
    ...input,
    metadata: input.metadata || {},
    created_at: new Date().toISOString(),
    delivered: false
  };
}
