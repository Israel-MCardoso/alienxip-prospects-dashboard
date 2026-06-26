import { AccessDenied } from "@/components/layout/access-denied";
import { getCurrentRole } from "@/lib/auth/get-current-role";
import { canAccessRoute } from "@/lib/auth/permissions";

export default async function WikiSegmentLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();
  if (!canAccessRoute(role, "/os/wiki")) {
    return <AccessDenied />;
  }
  return <>{children}</>;
}
