const SHEET_URL = "https://docs.google.com/spreadsheets/d/1KljvZ2qhtFOyxkhmW8xv6Bef4h8_ulv6tAxxJMtSwV4/gviz/tq?tqx=out:csv&gid=0";

function parseCsv(text) {
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

  const headers = rows.shift().map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "") : header);
  return rows
    .filter(values => values.some(Boolean))
    .map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

export default async function handler(request, response) {
  const sheet = await fetch(SHEET_URL, {
    headers: {
      "user-agent": "Alienxip prospects dashboard"
    }
  });

  if (!sheet.ok) {
    response.status(sheet.status).json({ error: "Could not fetch Google Sheet" });
    return;
  }

  const csv = await sheet.text();
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  response.status(200).json(parseCsv(csv));
}
