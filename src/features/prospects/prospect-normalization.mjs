export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header, index) => (
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  )) || [];

  return rows
    .filter((values) => values.some(Boolean))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

export function cityFromAddress(address) {
  const text = String(address || "");
  const match = text.match(/,\s*([^,-]+)\s*-\s*SP/i);

  if (match) return match[1].trim();
  if (/Jacare/i.test(text)) return "Jacarei";
  if (/S.o Jos/i.test(text)) return "Sao Jose dos Campos";
  return "";
}

export function firstUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^"',\]\s]+/);
  return match ? match[0] : "";
}

export function socialFrom(row) {
  const url = row.website || "";
  if (/instagram|facebook|linkedin/i.test(url)) return url;
  return "";
}

export function priorityFor(row) {
  const count = Number(String(row.ratingCount || "").replace(/\D/g, "")) || 0;
  const site = row.website || "";
  const booking = row.bookingLinks || "";
  let score = 0;

  if (count >= 100) score += 3;
  else if (count >= 30) score += 2;
  else if (count >= 10) score += 1;

  if (!site) score += 2;
  else if (/instagram|facebook|linktr\.ee/i.test(site)) score += 1;

  if (/wa\.me|whatsapp/i.test(booking)) score += 1;

  return score >= 5 ? "Alta" : score >= 3 ? "Media" : "Baixa";
}

export function offerFor(row) {
  const segment = `${row.type || ""} ${row.types || ""}`.toLowerCase();

  if (!row.website && !socialFrom(row)) {
    return "Presenca digital basica: site/landing page, Google Business otimizado, WhatsApp com rastreamento e formulario de lead.";
  }

  if (/odont|nutric|fisioterapia|psic|clinica|pilates|personal|academia/.test(segment)) {
    return "Funil de agendamento: landing page, WhatsApp automatizado, CRM, lembretes e dashboard de consultas/leads.";
  }

  if (/pet|banho|tosa|veterin/.test(segment)) {
    return "Agenda e recorrencia: cadastro de clientes/pets, lembretes, pacotes recorrentes, WhatsApp e painel operacional.";
  }

  if (/salao|beleza|cabeleireiro|estetica/.test(segment)) {
    return "Agendamento e fidelizacao: landing page, agenda, WhatsApp, campanhas locais e painel de retorno por servico.";
  }

  if (/tatuagem|tatuador|piercing/.test(segment)) {
    return "Portfolio e orcamento: site/portfolio, briefing, WhatsApp automatizado e funil para fechar sessoes.";
  }

  if (/advog|contab/.test(segment)) {
    return "Autoridade e triagem: site institucional, captura de leads, triagem automatizada e dashboard comercial.";
  }

  return "Diagnostico digital, automacoes de atendimento, CRM e painel de indicadores.";
}

export function normalizeProspect(row) {
  return {
    empresa: row.title,
    segmento: row.type,
    cidade: cityFromAddress(row.address),
    prioridade: priorityFor(row),
    telefone: row.phoneNumber,
    avaliacao: row.rating ? `${row.rating} (${row.ratingCount || "0"})` : "",
    site: row.website,
    social: socialFrom(row),
    whatsapp: firstUrl(row.bookingLinks),
    oferta: offerFor(row),
    proximo: "Validar redes sociais e preparar abordagem personalizada."
  };
}
