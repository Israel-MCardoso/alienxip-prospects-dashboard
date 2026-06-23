export type ProductionOutreachStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "replied"
  | "meeting_scheduled"
  | "failed"
  | "paused"
  | "stopped"
  | "opt_out";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface WhatsAppMessageInput {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMessageResult {
  provider: "mock-whatsapp" | "evolution";
  status: ProductionOutreachStatus;
  message_id?: string;
  dry_run: boolean;
  sent: boolean;
}

export interface WhatsAppProvider {
  readonly name: "mock-whatsapp" | "evolution";
  readonly enabled: boolean;
  sendMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult>;
  getStatus(): Promise<{ connected: boolean; status: "mock" | "disabled" | "connected" | "disconnected"; latency_ms?: number }>;
  checkInstanceHealth(): Promise<EvolutionHealthResult>;
}

export interface EvolutionProviderConfig {
  baseUrl?: string;
  instance?: string;
  apiKey?: string;
  transport?: EvolutionTransport;
}

export interface EvolutionTransportResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type EvolutionTransport = (
  url: string,
  options: { method: "GET" | "POST"; headers: Record<string, string>; body?: string }
) => Promise<EvolutionTransportResponse>;

export interface EvolutionHealthResult {
  connected: boolean;
  status: "connected" | "disconnected" | "unknown";
  latency_ms: number;
  raw_status_sanitized: string;
}
