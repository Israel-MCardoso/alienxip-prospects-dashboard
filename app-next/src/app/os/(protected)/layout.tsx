import { redirect } from "next/navigation";

import { OsShell } from "@/components/layout/os-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGlobalSearchData } from "@/features/workspace/data";
import { getTechSearchData } from "@/features/tech/data";
import { getKnowledgeSearchData } from "@/features/knowledge/data";

export default async function ProtectedOsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/os/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,email")
      .eq("id", user.id)
      .maybeSingle();
    const [searchData, techSearchData, knowledgeSearchData] = await Promise.all([getGlobalSearchData(), getTechSearchData(), getKnowledgeSearchData()]);

    return (
      <OsShell
        isAuthConfigured
        userEmail={profile?.email || user.email}
        userRole={profile?.role || null}
        searchData={{ ...searchData, ...techSearchData, ...knowledgeSearchData }}
      >
        {children}
      </OsShell>
    );
  }

  return <OsShell isAuthConfigured={false}>{children}</OsShell>;
}
