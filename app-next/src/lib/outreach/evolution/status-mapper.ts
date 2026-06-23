import type { ProductionOutreachStatus } from "./types";

export const OUTREACH_PRODUCTION_STATUSES: ProductionOutreachStatus[] = [
  "queued",
  "sent",
  "delivered",
  "read",
  "replied",
  "meeting_scheduled",
  "failed",
  "paused",
  "stopped",
  "opt_out"
];

const statusMap: Record<string, ProductionOutreachStatus> = {
  pending: "queued",
  queued: "queued",
  server_ack: "sent",
  sent: "sent",
  delivery_ack: "delivered",
  delivered: "delivered",
  read: "read",
  played: "read",
  replied: "replied",
  response: "replied",
  meeting_scheduled: "meeting_scheduled",
  failed: "failed",
  error: "failed",
  paused: "paused",
  stopped: "stopped",
  opt_out: "opt_out",
  unsubscribe: "opt_out"
};

export function mapEvolutionStatus(status: string | null | undefined): ProductionOutreachStatus {
  const normalized = String(status || "").trim().toLowerCase();
  return statusMap[normalized] || "failed";
}
