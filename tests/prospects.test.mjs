import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProspectImportRows,
  cityFromAddress,
  firstUrl,
  normalizeProspect,
  offerFor,
  parseCsv,
  priorityFor,
  socialFrom
} from "../src/features/prospects/prospect-normalization.mjs";

test("parseCsv preserves quoted commas and strips BOM from the first header", () => {
  const rows = parseCsv('\uFEFFtitle,address\n"Vale, Odontologia","Rua A, Jacarei - SP"\n');

  assert.deepEqual(rows, [
    {
      title: "Vale, Odontologia",
      address: "Rua A, Jacarei - SP"
    }
  ]);
});

test("cityFromAddress derives known cities from current address formats", () => {
  assert.equal(cityFromAddress("R. Santo Ivo, 371 - Cidade Salvador, Jacareí - SP"), "Jacareí");
  assert.equal(cityFromAddress("Av. Exemplo, Sao Jose dos Campos - SP"), "Sao Jose dos Campos");
});

test("link helpers preserve the current social and whatsapp extraction behavior", () => {
  assert.equal(socialFrom({ website: "https://instagram.com/alienxip" }), "https://instagram.com/alienxip");
  assert.equal(socialFrom({ website: "https://alienxip.com" }), "");
  assert.equal(firstUrl('["https://wa.me/5512999999999"]'), "https://wa.me/5512999999999");
});

test("priorityFor matches the current Alta Media Baixa scoring rules", () => {
  assert.equal(priorityFor({ ratingCount: "120", website: "", bookingLinks: "https://wa.me/5512" }), "Alta");
  assert.equal(priorityFor({ ratingCount: "30", website: "https://instagram.com/acme", bookingLinks: "" }), "Media");
  assert.equal(priorityFor({ ratingCount: "4", website: "https://acme.com", bookingLinks: "" }), "Baixa");
});

test("offerFor matches current segment-based offers", () => {
  assert.equal(
    offerFor({ website: "", type: "Clinica odontologica", types: "" }),
    "Presenca digital basica: site/landing page, Google Business otimizado, WhatsApp com rastreamento e formulario de lead."
  );

  assert.equal(
    offerFor({ website: "https://clinica.com", type: "Clinica odontologica", types: "" }),
    "Funil de agendamento: landing page, WhatsApp automatizado, CRM, lembretes e dashboard de consultas/leads."
  );
});

test("normalizeProspect returns the same shape consumed by the legacy dashboard", () => {
  const prospect = normalizeProspect({
    title: "Vale Odontologia",
    type: "Clinica odontologica",
    types: "",
    address: "R. Santo Ivo, 371 - Cidade Salvador, Jacareí - SP",
    phoneNumber: "(12) 99999-9999",
    rating: "5",
    ratingCount: "120",
    website: "",
    bookingLinks: '["https://wa.me/5512999999999"]'
  });

  assert.deepEqual(prospect, {
    empresa: "Vale Odontologia",
    segmento: "Clinica odontologica",
    cidade: "Jacareí",
    prioridade: "Alta",
    telefone: "(12) 99999-9999",
    avaliacao: "5 (120)",
    site: "",
    social: "",
    whatsapp: "https://wa.me/5512999999999",
    oferta: "Presenca digital basica: site/landing page, Google Business otimizado, WhatsApp com rastreamento e formulario de lead.",
    proximo: "Validar redes sociais e preparar abordagem personalizada."
  });
});

test("buildProspectImportRows creates stable external ids and deduplicates rows", () => {
  const rows = buildProspectImportRows([
    {
      title: "Vale Odontologia",
      type: "Clinica odontologica",
      address: "R. Santo Ivo, 371 - Cidade Salvador, Jacareí - SP",
      phoneNumber: "(12) 99999-9999",
      rating: "5",
      ratingCount: "120",
      website: "",
      bookingLinks: '["https://wa.me/5512999999999"]'
    },
    {
      title: "Vale Odontologia",
      type: "Clinica odontologica",
      address: "R. Santo Ivo, 371 - Cidade Salvador, Jacareí - SP",
      phoneNumber: "(12) 99999-9999",
      rating: "5",
      ratingCount: "120",
      website: "",
      bookingLinks: '["https://wa.me/5512999999999"]'
    }
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_source_id, "vale-odontologia-jacarei-12-99999-9999");
  assert.equal(rows[0].status, "new");
  assert.equal(rows[0].temperature, "hot");
  assert.equal(rows[0].source, "google_sheet");
});

test("buildProspectImportRows maps current priorities to valid temperatures", () => {
  const rows = buildProspectImportRows([
    { title: "Baixa", ratingCount: "1", website: "https://site.com", bookingLinks: "" },
    { title: "Media", ratingCount: "30", website: "https://instagram.com/acme", bookingLinks: "" },
    { title: "Alta", ratingCount: "100", website: "", bookingLinks: "https://wa.me/5512" }
  ]);

  assert.deepEqual(rows.map((row) => row.temperature), ["cold", "warm", "hot"]);
});
