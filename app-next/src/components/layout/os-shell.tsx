"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FilesIcon,
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListTodoIcon,
  SettingsIcon,
  TargetIcon,
  WrenchIcon,
  MenuIcon,
  XIcon,
  FileTextIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalSearch, type GlobalSearchData } from "@/components/layout/global-search";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/os", label: "Início", icon: HomeIcon },
  { href: "/os/dashboard", label: "Painel", icon: LayoutDashboardIcon },
  { href: "/os/prospects", label: "Prospects", icon: TargetIcon },
  { href: "/os/prospects/pipeline", label: "Funil de Vendas", icon: ClipboardListIcon },
  { href: "/os/tasks", label: "Tarefas", icon: ListTodoIcon },
  { href: "/os/calendar", label: "Calendário", icon: CalendarDaysIcon },
  { href: "/os/activity", label: "Atividades", icon: HistoryIcon },
  { href: "/os/clients", label: "Clientes", icon: Building2Icon },
  { href: "/os/companies", label: "Empresas", icon: Building2Icon },
  { href: "/os/projects", label: "Projetos", icon: BriefcaseBusinessIcon },
  { href: "/os/tech", label: "Tecnologia", icon: WrenchIcon },
  { href: "/os/wiki", label: "Wiki", icon: LibraryIcon },
  { href: "/os/playbooks", label: "Playbooks", icon: FileTextIcon },
  { href: "/os/files", label: "Arquivos", icon: FilesIcon },
  { href: "/os/settings", label: "Configurações", icon: SettingsIcon }
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer container */}
          <aside className="relative flex w-64 flex-col bg-sidebar border-r px-3 py-4 text-sidebar-foreground animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-2">
              <Link href="/os" className="flex items-center gap-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  AX
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-sm font-semibold leading-tight text-white font-mono">ALIENXIP OS</span>
                  <span className="text-xs text-muted-foreground">Internal platform</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background/50 hover:bg-muted text-muted-foreground"
                aria-label="Fechar menu"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon data-icon="inline-start" className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-lg border bg-[#050505] p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground text-white">Sprint 10 (Hardening)</div>
              <div>Plataforma consolidada e responsiva.</div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex lg:flex-col">
        <Link href="/os" className="flex items-center gap-2 px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            AX
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-white font-mono">ALIENXIP OS</span>
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
          <div className="font-medium text-foreground text-white">Sprint 10 (Hardening)</div>
          <div>Plataforma consolidada e responsiva.</div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background hover:bg-muted text-muted-foreground lg:hidden mr-1"
              aria-label="Abrir menu"
            >
              <MenuIcon className="size-4" />
            </button>
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
