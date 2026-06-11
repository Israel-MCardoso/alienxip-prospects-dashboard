import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkspaceHome } from "@/features/workspace/workspace-home";

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

  return (
    <WorkspaceHome
      userEmail={userEmail}
      userRole={userRole}
      preferredArea={preferredArea}
    />
  );
}
