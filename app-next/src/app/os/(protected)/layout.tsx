import { redirect } from "next/navigation";

import { OsShell } from "@/components/layout/os-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedOsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/os/login");
    }
  }

  return <OsShell isAuthConfigured={Boolean(supabase)}>{children}</OsShell>;
}
