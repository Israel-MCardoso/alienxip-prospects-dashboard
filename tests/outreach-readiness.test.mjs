import test from "node:test";
import assert from "node:assert/strict";

// Recreate stuck leads classification logic for testing
function categorizeStuckLeads(prospects, nowTime) {
  const msInHour = 60 * 60 * 1000;
  const getMsAgo = (dateStr) => nowTime - new Date(dateStr).getTime();

  const stuck24h = [];
  const stuck48h = [];
  const stuck72h = [];

  prospects.forEach((p) => {
    const o = p.prospect_outreach?.[0];
    if (!o || !["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status)) return;
    
    const hours = getMsAgo(o.updated_at) / msInHour;
    if (hours >= 72) {
      stuck72h.push(p);
    } else if (hours >= 48) {
      stuck48h.push(p);
    } else if (hours >= 24) {
      stuck24h.push(p);
    }
  });

  return { stuck24h, stuck48h, stuck72h };
}

// Recreate payload sanitization logic for testing
function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const sanitized = { ...payload };

  if (sanitized.phone) {
    sanitized.phone = maskPhone(sanitized.phone);
  }
  if (sanitized.whatsapp) {
    sanitized.whatsapp = maskPhone(sanitized.whatsapp);
  }

  if (typeof sanitized.message === "string") {
    sanitized.message = limitMessage(sanitized.message);
  }

  const sensitiveKeys = [
    "secret",
    "token",
    "password",
    "apikey",
    "authorization",
    "service_role",
    "webhook_secret"
  ];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

function maskPhone(phone) {
  const str = String(phone);
  if (str.length <= 4) return "****";
  const start = str.substring(0, 4);
  const end = str.substring(str.length - 2);
  return `${start}******${end}`;
}

function limitMessage(msg) {
  if (msg.length > 200) {
    return msg.substring(0, 200) + "...";
  }
  return msg;
}

test("categorizeStuckLeads correctly groups prospects by update age", () => {
  const now = new Date("2026-06-11T12:00:00.000Z").getTime();

  const prospects = [
    {
      id: "1",
      name: "Lead Novo",
      prospect_outreach: [{ status: "queued", updated_at: "2026-06-11T11:00:00.000Z" }] // 1 hour ago (Not stuck)
    },
    {
      id: "2",
      name: "Lead 24h",
      prospect_outreach: [{ status: "sent", updated_at: "2026-06-10T11:00:00.000Z" }] // 25 hours ago
    },
    {
      id: "3",
      name: "Lead 48h",
      prospect_outreach: [{ status: "waiting_reply", updated_at: "2026-06-09T11:00:00.000Z" }] // 49 hours ago
    },
    {
      id: "4",
      name: "Lead 72h",
      prospect_outreach: [{ status: "negotiating", updated_at: "2026-06-08T11:00:00.000Z" }] // 73 hours ago
    },
    {
      id: "5",
      name: "Lead Inativo",
      prospect_outreach: [{ status: "paused", updated_at: "2026-06-08T11:00:00.000Z" }] // Paused (Ignored)
    }
  ];

  const result = categorizeStuckLeads(prospects, now);

  assert.equal(result.stuck24h.length, 1);
  assert.equal(result.stuck24h[0].id, "2");

  assert.equal(result.stuck48h.length, 1);
  assert.equal(result.stuck48h[0].id, "3");

  assert.equal(result.stuck72h.length, 1);
  assert.equal(result.stuck72h[0].id, "4");
});

test("sanitizePayload masks phone numbers and strips credentials", () => {
  const rawPayload = {
    prospect_id: "prospect-123",
    phone: "5512999991234",
    whatsapp: "5512988884321",
    message: "A".repeat(250),
    event_type: "reply",
    webhook_secret: "super-secret-key-123",
    apiKey: "some-api-key"
  };

  const sanitized = sanitizePayload(rawPayload);

  assert.equal(sanitized.prospect_id, "prospect-123");
  assert.equal(sanitized.phone, "5512******34");
  assert.equal(sanitized.whatsapp, "5512******21");
  assert.equal(sanitized.message.length, 203); // 200 + '...'
  assert.ok(sanitized.message.endsWith("..."));
  assert.equal(sanitized.webhook_secret, undefined);
  assert.equal(sanitized.apiKey, undefined);
});
