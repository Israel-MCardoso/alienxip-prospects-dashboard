import { redirect } from "next/navigation";

import { OsShell } from "@/components/layout/os-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGlobalSearchData } from "@/features/workspace/data";
import { getTechSearchData } from "@/features/tech/data";

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
    const [searchData, techSearchData] = await Promise.all([getGlobalSearchData(), getTechSearchData()]);

    return (
      <OsShell
        isAuthConfigured
        userEmail={profile?.email || user.email}
        userRole={profile?.role || null}
        searchData={{ ...searchData, ...techSearchData }}
      >
        {children}
      </OsShell>
    );
  }

  return <OsShell isAuthConfigured={false}>{children}</OsShell>;
}
