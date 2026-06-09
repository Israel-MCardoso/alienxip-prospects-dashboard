import test from "node:test";
import assert from "node:assert/strict";

import {
  taskSchema,
  conversionSchema,
  groupProspectsByPipelineStatus,
  canConvertProspect,
  buildCompanyClientFromProspect
} from "../app-next/src/features/commercial/commercial-helpers.mjs";

test("taskSchema validates follow-up task input", () => {
  const task = taskSchema.parse({
    title: "Enviar proposta",
    description: "Enviar proposta inicial por WhatsApp",
    status: "pending",
    priority: "high",
    due_date: "2026-06-15"
  });

  assert.equal(task.title, "Enviar proposta");
  assert.equal(task.priority, "high");
  assert.throws(() => taskSchema.parse({ title: "", status: "pending", priority: "medium" }));
});

test("groupProspectsByPipelineStatus creates empty columns and groups prospects", () => {
  const grouped = groupProspectsByPipelineStatus([
    { id: "1", name: "A", status: "frio", temperature: "cold" },
    { id: "2", name: "B", status: "proposta", temperature: "hot" }
  ]);

  assert.equal(grouped.frio.length, 1);
  assert.equal(grouped.proposta.length, 1);
  assert.deepEqual(grouped.negociacao, []);
});

test("conversion helpers avoid duplicate conversion payloads", () => {
  assert.equal(canConvertProspect({ status: "fechado", converted_client_id: null }), true);
  assert.equal(canConvertProspect({ status: "fechado", converted_client_id: "client-1" }), false);

  const conversion = conversionSchema.parse({
    main_contact_name: "Israel",
    main_contact_email: "israel@example.com",
    monthly_value: "1500"
  });

  const payload = buildCompanyClientFromProspect({
    id: "prospect-1",
    name: "Alien Prospect",
    segment: "Saude",
    city: "Jacarei",
    state: "SP",
    website_url: "https://example.com",
    instagram_url: "https://instagram.com/example",
    whatsapp: "https://wa.me/5512",
    notes: "Observacao"
  }, conversion);

  assert.equal(payload.company.name, "Alien Prospect");
  assert.equal(payload.client.monthly_value, 1500);
});
