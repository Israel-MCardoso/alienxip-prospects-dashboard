import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkspaceHome } from "@/features/workspace/workspace-home";
import { getDashboardOverview } from "@/features/workspace/data";

type AreaKey = "comercial" | "operacao" | "tech" | "design" | "conhecimento" | "gestao";

function getPreferredArea(role: string | null, email?: string | null): AreaKey {
  const r = role || "member";
  const e = (email || "").toLowerCase();

  if (r === "owner" || r === "admin" || r === "manager") return "gestao";
  if (r === "operator") return "tech";
  if (e.includes("design") || e.includes("art")) return "design";
  if (r === "member") return "tech"; // default to tech for members/developers
  return "comercial"; // default fallback
}

export default async function OsHomePage() {
  const supabase = await createSupabaseServerClient();
  let userEmail: string | null = null;
  let userRole: string | null = null;

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        userRole = profile.role;
        userEmail = profile.email || user.email || null;
      }
    }
  }

  const preferredArea = getPreferredArea(userRole, userEmail);

  const todayStr = new Date().toISOString().split("T")[0];

  // Run all three fetches in parallel
  const [overview, diagnosticsResult, proposalsResult] = await Promise.all([
    getDashboardOverview(),
    (async () => {
      if (!supabase) return [] as { prospect_id: string }[];
      try {
        const { data } = await supabase.from("prospect_diagnostics").select("prospect_id");
        return data || [];
      } catch {
        return [] as { prospect_id: string }[];
      }
    })(),
    (async () => {
      if (!supabase) return [] as { id: string }[];
      try {
        const { data } = await supabase.from("prospect_proposals").select("id").eq("status", "sent");
        return data || [];
      } catch {
        return [] as { id: string }[];
      }
    })()
  ]);

  // Calculate leads created today
  const leadsDoDia = overview.prospects.filter(p => p.created_at && p.created_at.startsWith(todayStr)).length;

  // Calculate pending diagnostics (active prospects without diagnostics)
  const diagnosedIds = new Set(diagnosticsResult.map((d: { prospect_id: string }) => d.prospect_id));
  const diagnosticosPendentes = overview.prospects.filter(
    p => !diagnosedIds.has(p.id) && !["fechado", "perdido", "won", "lost", "archived"].includes(p.status)
  ).length;

  // Calculate sent/active proposals
  const propostasEnviadas = proposalsResult.length;

  // Calculate active projects count
  const projetosAtivos = overview.projects.filter(p => p.status === "active" || p.status === "planning").length;

  // Calculate critical bugs count (active bugs that are critical/high severity or urgent priority)
  const bugsCriticos = overview.bugs.filter(
    b => ["open", "triage", "in_progress"].includes(b.status) && (b.severity === "critical" || b.severity === "high" || b.priority === "urgent")
  ).length;

  const missionControlMetrics = {
    leadsDoDia,
    diagnosticosPendentes,
    propostasEnviadas,
    fechamentosDoMes: overview.metrics.monthConversions || 0,
    projetosAtivos,
    bugsCriticos,
    tarefasAtrasadas: overview.metrics.overdueTasks || 0,
    leadsEmAutomacao: overview.metrics.leadsEmAutomacao || 0,
    aguardandoResposta: overview.metrics.aguardandoResposta || 0,
    responderam: overview.metrics.responderam || 0,
    negociando: overview.metrics.negociando || 0,
    reunioesMarcadas: overview.metrics.reunioesMarcadas || 0,
    taxaResposta: overview.metrics.taxaResposta || 0,
    taxaConversao: overview.metrics.taxaConversao || 0
  };

  return (
    <WorkspaceHome
      userEmail={userEmail}
      userRole={userRole}
      preferredArea={preferredArea}
      metrics={missionControlMetrics}
    />
  );
}
