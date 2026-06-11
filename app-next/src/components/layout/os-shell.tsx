"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalSearch, type GlobalSearchData } from "@/components/layout/global-search";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/display-helpers";
import Image from "next/image";

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
  const [collapsed, setCollapsed] = useState(false);

  // Load sidebar state from localStorage safely after hydration
  useEffect(() => {
    const val = localStorage.getItem("sidebar-collapsed");
    if (val === "true") {
      const timer = setTimeout(() => {
        setCollapsed(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleCollapsed = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("sidebar-collapsed", String(newVal));
  };

  return (
    <div className="min-h-screen bg-[#050508] text-foreground transition-colors duration-300">
      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer container */}
          <aside className="relative flex w-64 flex-col bg-sidebar border-r border-purple-500/10 px-3 py-4 text-sidebar-foreground animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-2">
              <Link href="/os" className="flex items-center gap-2 py-2" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="/brand/motherxip-logo.png"
                  alt="MOTHERXIP logo"
                  width={32}
                  height={32}
                  className="object-contain shrink-0 rounded-lg"
                />
                <span className="flex flex-col text-left">
                  <span className="text-sm font-semibold leading-tight text-white font-mono tracking-wider">MOTHERXIP</span>
                  <span className="text-[10px] text-muted-foreground">Centro Operacional</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/15 bg-background/50 hover:bg-muted text-muted-foreground"
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
                      "flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-purple-950/20 hover:text-purple-300",
                      active && "bg-purple-950/30 border border-purple-500/15 text-purple-300"
                    )}
                  >
                    <Icon data-icon="inline-start" className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-lg border border-purple-500/10 bg-[#08080c] p-3 text-xs text-muted-foreground">
              <div className="font-medium text-white font-mono">MOTHERXIP v11</div>
              <div>Evolução visual e controle de acesso.</div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      {/* Desktop Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-white/5 bg-[#08080a] px-3 py-4 text-sidebar-foreground lg:flex lg:flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] z-30",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between px-1">
          <Link href="/os" className="flex items-center gap-2.5 py-2 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <Image
              src="/brand/motherxip-logo.png"
              alt="MOTHERXIP logo"
              width={38}
              height={38}
              className="object-contain shrink-0 rounded-xl bg-purple-500/5 border border-purple-500/20 p-1 shadow-inner shadow-purple-500/10"
            />
            <span className={cn("flex flex-col text-left transition-opacity duration-300", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
              <span className="text-sm font-black leading-tight text-white font-mono tracking-wider whitespace-nowrap bg-clip-text bg-gradient-to-r from-white via-white to-purple-400">MOTHERXIP</span>
              <span className="text-[9px] font-bold font-mono tracking-widest text-muted-foreground uppercase whitespace-nowrap">MISSION CONTROL</span>
            </span>
          </Link>

          {/* Toggle sidebar button inside sidebar */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              "hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-white/5 bg-background/50 text-muted-foreground hover:text-white hover:border-purple-500/35 hover:bg-purple-950/20 transition-all cursor-pointer",
              collapsed ? "mx-auto" : ""
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRightIcon className="size-3.5" /> : <ChevronLeftIcon className="size-3.5" />}
          </button>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 pr-0.5 overflow-y-auto scrollbar-none">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <div key={item.href} className="relative group flex items-center">
                {active && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-0.5 h-4 bg-purple-500 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all duration-200 w-full",
                    collapsed 
                      ? "justify-center px-0 w-10 mx-auto" 
                      : "gap-3 px-3.5 pl-4.5",
                    active 
                      ? "bg-purple-950/15 text-purple-300 border border-purple-500/10" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  <Icon data-icon="inline-start" className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-purple-400" : "text-zinc-500")} />
                  <span className={cn("transition-opacity duration-300", collapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto")}>
                    {item.label}
                  </span>
                </Link>
                {/* Tooltip on Hover when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-zinc-950 border border-purple-500/20 text-purple-300 text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-lg font-mono uppercase tracking-wider whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className={cn("mt-auto rounded-xl border border-white/5 bg-[#0a0a0c] p-3.5 text-[10px] font-mono text-muted-foreground transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]", collapsed ? "opacity-0 h-0 p-0 overflow-hidden border-0" : "opacity-100")}>
          <div className="font-extrabold text-white tracking-wider">MOTHERXIP OS</div>
          <div className="text-[9px] mt-1 text-zinc-500">MISSION CONTROL v12.5</div>
        </div>
      </aside>

      <div className={cn("transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-purple-500/10 bg-[#050508]/80 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/15 bg-background hover:bg-purple-950/20 text-muted-foreground lg:hidden mr-1"
              aria-label="Abrir menu"
            >
              <MenuIcon className="size-4" />
            </button>
            <ClipboardListIcon className="text-purple-400" data-icon="inline-start" />
            <span className="text-sm font-medium text-white font-mono">MOTHERXIP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <div className="font-medium text-white">{userEmail || "sem sessao"}</div>
              <div className="capitalize text-purple-400 font-mono text-[10px]">{userRole ? roleLabel(userRole) : "profile pendente"}</div>
            </div>
            {searchData ? <GlobalSearch data={searchData} /> : <Button variant="outline" size="sm">Search</Button>}
            <form action={logoutAction}>
              <Button size="sm" variant="secondary" className="border border-purple-500/15 bg-background hover:bg-purple-950/20 text-white" type="submit" disabled={!isAuthConfigured}>
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
