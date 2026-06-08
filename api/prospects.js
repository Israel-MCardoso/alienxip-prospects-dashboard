import { parseCsv } from "../src/features/prospects/prospect-normalization.mjs";

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1KljvZ2qhtFOyxkhmW8xv6Bef4h8_ulv6tAxxJMtSwV4/gviz/tq?tqx=out:csv&gid=0";
const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL || DEFAULT_SHEET_URL;

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
