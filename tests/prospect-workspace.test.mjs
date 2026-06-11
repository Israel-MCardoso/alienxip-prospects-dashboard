import test from "node:test";
import assert from "node:assert/strict";

import {
  diagnosticSchema,
  noteSchema,
  formatActivityDate,
  activityLabel
} from "../app-next/src/features/prospects/workspace-helpers.mjs";

test("diagnosticSchema accepts digital diagnostic fields and normalizes opportunities", () => {
  const result = diagnosticSchema.parse({
    facebook_notes: "Sem pagina ativa",
    instagram_notes: "Perfil existe, pouco conteudo",
    whatsapp_notes: "Atendimento manual",
    website_notes: "Sem landing page",
    google_business_notes: "Google Meu Negocio incompleto",
    diagnosis_summary: "Oportunidade clara de presenca digital",
    opportunities: "Landing page\nWhatsApp automatizado\nCRM"
  });

  assert.deepEqual(result.opportunities, [
    "Landing page",
    "WhatsApp automatizado",
    "CRM"
  ]);
});

test("noteSchema rejects empty notes and accepts Sprint 3 note types", () => {
  assert.throws(() => noteSchema.parse({ content: "", type: "observacao" }));

  const parsed = noteSchema.parse({
    content: "Marcar follow-up com decisor.",
    type: "follow_up"
  });

  assert.equal(parsed.type, "follow_up");
});

test("activity helpers format labels and dates for timeline", () => {
  assert.equal(activityLabel("diagnostic_created"), "Diagnostico criado");
  assert.equal(formatActivityDate("2026-06-08T12:30:00.000Z"), "08/06/2026 12:30");
});
