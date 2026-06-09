"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListTodoIcon,
  SettingsIcon,
  TargetIcon,
  WrenchIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalSearch, type GlobalSearchData } from "@/components/layout/global-search";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/os", label: "Home", icon: HomeIcon },
  { href: "/os/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/os/prospects", label: "Prospects", icon: TargetIcon },
  { href: "/os/prospects/pipeline", label: "Pipeline", icon: ClipboardListIcon },
  { href: "/os/tasks", label: "Tarefas", icon: ListTodoIcon },
  { href: "/os/calendar", label: "Calendario", icon: CalendarDaysIcon },
  { href: "/os/activity", label: "Activity", icon: HistoryIcon },
  { href: "/os/clients", label: "Clients", icon: Building2Icon },
  { href: "/os/companies", label: "Empresas", icon: BriefcaseBusinessIcon },
  { href: "/os/projects", label: "Projects", icon: BriefcaseBusinessIcon },
  { href: "/os/tech", label: "Tech", icon: WrenchIcon },
  { href: "/os/wiki", label: "Wiki", icon: LibraryIcon },
  { href: "/os/settings", label: "Settings", icon: SettingsIcon }
];

export function OsShell({
  children,
  isAuthConfigured,
  userEmail,
  userRole,
  searchData
}: {
  children: React.ReactNode;
  isAuthConfigured: boolean;
  userEmail?: string | null;
  userRole?: string | null;
  searchData?: GlobalSearchData;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex lg:flex-col">
        <Link href="/os" className="flex items-center gap-2 px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            AX
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">ALIENXIP OS</span>
            <span className="text-xs text-muted-foreground">Internal platform</span>
          </span>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon data-icon="inline-start" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Sprint 1</div>
          <div>Fundacao tecnica em paralelo ao dashboard legado.</div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <ClipboardListIcon className="text-muted-foreground" data-icon="inline-start" />
            <span className="text-sm font-medium">Workspace interno</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <div className="font-medium text-foreground">{userEmail || "sem sessao"}</div>
              <div>{userRole || (isAuthConfigured ? "profile pendente" : "config pendente")}</div>
            </div>
            {searchData ? <GlobalSearch data={searchData} /> : <Button variant="outline" size="sm">Search</Button>}
            <form action={logoutAction}>
              <Button size="sm" variant="secondary" type="submit" disabled={!isAuthConfigured}>
                Sair
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
