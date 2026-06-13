import test from "node:test";
import assert from "node:assert/strict";

// Helper to validate phone cleaner and length logic used in dispatch
function cleanAndValidatePhone(phone) {
  const phoneClean = (phone || "").replace(/\D/g, "");
  if (!phoneClean || phoneClean.length < 8 || phoneClean.length > 15) {
    return { valid: false, cleaned: phoneClean };
  }
  return { valid: true, cleaned: phoneClean };
}

// Active automation lock statuses
const ACTIVE_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "waiting_reply",
  "replied",
  "negotiating",
  "meeting_scheduled"
];

function isAutomationActive(status) {
  return ACTIVE_STATUSES.includes(status);
}

// Complete outreach status enum list for Sprint 16
const VALID_OUTREACH_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "waiting_reply",
  "replied",
  "negotiating",
  "meeting_scheduled",
  "failed",
  "paused",
  "stopped",
  "disqualified"
];

test("cleanAndValidatePhone identifies valid phone shapes and rejects invalid ones", () => {
  // Valid cases
  assert.deepEqual(cleanAndValidatePhone("(12) 99999-9999"), { valid: true, cleaned: "12999999999" });
  assert.deepEqual(cleanAndValidatePhone("12345678"), { valid: true, cleaned: "12345678" });
  assert.deepEqual(cleanAndValidatePhone("5511999999999"), { valid: true, cleaned: "5511999999999" });

  // Invalid cases (too short, too long, empty)
  assert.deepEqual(cleanAndValidatePhone("1234567"), { valid: false, cleaned: "1234567" });
  assert.deepEqual(cleanAndValidatePhone("1234567890123456"), { valid: false, cleaned: "1234567890123456" });
  assert.deepEqual(cleanAndValidatePhone(""), { valid: false, cleaned: "" });
  assert.deepEqual(cleanAndValidatePhone(null), { valid: false, cleaned: "" });
});

test("isAutomationActive locks queued and in-progress outreach but allows retry on inactive states", () => {
  // Should lock active states
  assert.equal(isAutomationActive("queued"), true);
  assert.equal(isAutomationActive("sent"), true);
  assert.equal(isAutomationActive("delivered"), true);
  assert.equal(isAutomationActive("waiting_reply"), true);
  assert.equal(isAutomationActive("replied"), true);
  assert.equal(isAutomationActive("negotiating"), true);
  assert.equal(isAutomationActive("meeting_scheduled"), true);

  // Should allow retry on paused, stopped, failed, disqualified
  assert.equal(isAutomationActive("failed"), false);
  assert.equal(isAutomationActive("paused"), false);
  assert.equal(isAutomationActive("stopped"), false);
  assert.equal(isAutomationActive("disqualified"), false);
  assert.equal(isAutomationActive("not_started"), false);
});

test("VALID_OUTREACH_STATUSES contains all Sprint 16 approved statuses", () => {
  assert.ok(VALID_OUTREACH_STATUSES.includes("waiting_reply"));
  assert.ok(VALID_OUTREACH_STATUSES.includes("replied"));
  assert.ok(VALID_OUTREACH_STATUSES.includes("meeting_scheduled"));
  assert.equal(VALID_OUTREACH_STATUSES.length, 11);
});
