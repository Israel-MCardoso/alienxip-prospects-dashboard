import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertOutreachOperator, dispatchOutreachBatch } from "@/features/outreach/dispatch-service";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  // 1. Validate authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Validate operator role — shared rule from dispatch-service
  try {
    await assertOutreachOperator(user.id);
  } catch {
    return NextResponse.json({ error: "Permissão negada. Requer operador." }, { status: 403 });
  }

  // 3. Parse input
  let body: { prospect_ids: string[]; automation_source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { prospect_ids, automation_source = "sandbox" } = body;
  if (!Array.isArray(prospect_ids) || prospect_ids.length === 0) {
    return NextResponse.json({ error: "Lista prospect_ids inválida ou vazia." }, { status: 400 });
  }

  // 4. Batch size limits
  const targetEnv = automation_source === "sandbox" ? "sandbox" : "production";

  if (targetEnv === "production" && prospect_ids.length > 100) {
    return NextResponse.json({
      error: `Limite de lote excedido. Em produção, você pode enviar no máximo 100 leads por vez (solicitado: ${prospect_ids.length}).`
    }, { status: 400 });
  }

  if (targetEnv === "sandbox" && prospect_ids.length > 2) {
    return NextResponse.json({
      error: `Limite de lote excedido. Em sandbox, você pode enviar no máximo 2 leads por vez nesta validação inicial (solicitado: ${prospect_ids.length}).`
    }, { status: 400 });
  }

  // 5. Delegate to service — no self-fetch, no HTTP roundtrip
  try {
    const result = await dispatchOutreachBatch({
      prospect_ids,
      automation_source,
      user_id: user.id,
      user_email: user.email ?? null
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
