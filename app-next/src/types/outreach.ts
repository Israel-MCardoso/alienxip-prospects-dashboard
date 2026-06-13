import type { Json } from "./database";

export type OutreachStatus =
  | "not_started"
  | "queued"
  | "sent"
  | "delivered"
  | "waiting_reply"
  | "replied"
  | "negotiating"
  | "meeting_scheduled"
  | "failed"
  | "paused"
  | "stopped"
  | "disqualified";

export type OutreachChannel = "whatsapp" | "instagram" | "email" | "manual";

export interface ProspectOutreachRow {
  id: string;
  prospect_id: string;
  status: OutreachStatus;
  channel: OutreachChannel;
  automation_source: string | null;
  n8n_workflow_id: string | null;
  n8n_execution_id: string | null;
  last_message_at: string | null;
  next_follow_up_at: string | null;
  meeting_scheduled_at: string | null;
  meeting_link: string | null;
  paused_at: string | null;
  stopped_at: string | null;
  error_message: string | null;
  metadata: Json;
  last_message_preview: string | null;
  meeting_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachEventRow {
  id: string;
  prospect_id: string;
  outreach_id: string | null;
  event_type: string;
  status: OutreachStatus;
  channel: OutreachChannel;
  message: string | null;
  n8n_execution_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface WebhookAuditLogRow {
  id: string;
  execution_id: string | null;
  event_type: string | null;
  status: string;
  secret_validated: boolean;
  duplicate_ignored: boolean;
  payload: Json;
  error_message: string | null;
  created_at: string;
}

export interface OutreachBatchRow {
  id: string;
  batch_id: string;
  automation_source: string;
  status: "created" | "dispatched" | "partially_dispatched" | "failed" | "completed";
  total_requested: number;
  total_valid: number;
  total_skipped: number;
  total_dispatched: number;
  n8n_response_status: number | null;
  error_message: string | null;
  metadata: Json;
  created_by: string | null;
  created_by_email: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
}


