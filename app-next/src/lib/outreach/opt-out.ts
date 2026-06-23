const optOutPatterns = [
  /\bpare\b/i,
  /\bparar\b/i,
  /\bn[aã]o tenho interesse\b/i,
  /\bremover\b/i,
  /\bcancelar\b/i,
  /\bstop\b/i,
  /\bunsubscribe\b/i
];

export function detectOptOut(message: string) {
  const normalized = String(message || "").trim();
  const matched = optOutPatterns.find((pattern) => pattern.test(normalized));
  return {
    isOptOut: Boolean(matched),
    matchedPattern: matched?.source || null,
    status: Boolean(matched) ? "opt_out" as const : null
  };
}

export function shouldBlockOutboundForStatus(status: string | null | undefined) {
  return ["opt_out", "stopped", "paused"].includes(String(status || ""));
}

export function buildOptOutEvent(input: { prospect_id: string; message: string }) {
  const decision = detectOptOut(input.message);
  return {
    prospect_id: input.prospect_id,
    event_type: decision.isOptOut ? "opt_out_detected" : "message_received",
    status: decision.status,
    should_block_outbound: decision.isOptOut,
    audit_required: decision.isOptOut
  };
}
