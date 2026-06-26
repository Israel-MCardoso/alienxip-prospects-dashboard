// Central role-based access control for the OS app surface.
// App-layer only — this does NOT replace Supabase RLS. Owner/admin have full
// access; "commercial" is scoped to the sales hubs. Other existing roles keep
// full app access so already-validated logins/flows are not changed.

export const FULL_ACCESS_ROLES = ["owner", "admin"] as const;

// Route prefixes a "commercial" user is allowed to reach.
export const COMMERCIAL_ALLOWED_PREFIXES = [
  "/os/dashboard",
  "/os/prospects",
  "/os/companies",
  "/os/clients",
  "/os/projects",
  "/os/tasks",
  "/os/calendar",
  "/os/activity",
  "/os/outreach",
  "/os/playbooks"
] as const;

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "/os";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/os";
}

export function isFullAccessRole(role: string | null | undefined): boolean {
  return Boolean(role) && (FULL_ACCESS_ROLES as readonly string[]).includes(role as string);
}

export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  if (isFullAccessRole(role)) return true;

  const path = normalizePath(pathname);

  // "/os" home (Controle de Missão) is available to every authenticated role.
  if (path === "/os") return true;

  if (role === "commercial") {
    return COMMERCIAL_ALLOWED_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
  }

  // manager / member / viewer / operator: unchanged (full app access) so existing
  // logins keep working. Only "commercial" is scoped by this helper.
  return true;
}

type NavGroupLike = { label: string; items: ReadonlyArray<{ href: string }> };

export function canAccessHub(role: string | null | undefined, group: NavGroupLike): boolean {
  return group.items.some((item) => canAccessRoute(role, item.href));
}

export function filterNavigationGroups<G extends NavGroupLike>(
  groups: ReadonlyArray<G>,
  role: string | null | undefined
): G[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(role, item.href))
    }))
    .filter((group) => group.items.length > 0) as G[];
}
