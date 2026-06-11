import { NextResponse } from "next/server";

import { getGlobalSearchResults } from "@/features/governance/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const result = await getGlobalSearchResults(q);
  return NextResponse.json(result);
}
