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
  ChevronRightIcon,
  SunIcon,
  MoonIcon
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Sync state with DOM theme class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const activeTheme = isDark ? "dark" : "light";
    const timer = setTimeout(() => {
      setTheme(activeTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer container */}
          <aside className="relative flex w-64 flex-col bg-sidebar border-r border-sidebar-border px-3 py-4 text-sidebar-foreground animate-in slide-in-from-left duration-200">
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
                  <span className="text-sm font-semibold leading-tight text-foreground font-mono tracking-wider">MOTHERXIP</span>
                  <span className="text-[10px] text-muted-foreground">Centro Operacional</span>
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleTheme}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  aria-label="Alternar tema"
                >
                  {theme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-indigo-500" />}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-muted text-muted-foreground cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
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
                      "flex h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && "bg-sidebar-accent border border-sidebar-border text-sidebar-primary"
                    )}
                  >
                    <Icon data-icon="inline-start" className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3.5 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground font-mono">MOTHERXIP OS</div>
              <div>Ambiente corporativo de missão crítica.</div>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex lg:flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] z-30",
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
              className="object-contain shrink-0 rounded-xl bg-primary/5 border border-primary/20 p-1 shadow-inner shadow-primary/10"
            />
            <span className={cn("flex flex-col text-left transition-opacity duration-300", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
              <span className="text-sm font-black leading-tight text-foreground font-mono tracking-wider whitespace-nowrap bg-clip-text bg-gradient-to-r from-foreground to-primary">MOTHERXIP</span>
              <span className="text-[9px] font-bold font-mono tracking-widest text-muted-foreground uppercase whitespace-nowrap">MISSION CONTROL</span>
            </span>
          </Link>

          {/* Toggle sidebar button inside sidebar */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              "hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-sidebar-border bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-sidebar-accent transition-all cursor-pointer",
              collapsed ? "mx-auto" : ""
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRightIcon className="size-3.5" /> : <ChevronLeftIcon className="size-3.5" />}
          </button>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 pr-0.5 overflow-y-auto scrollbar-none">
          {navigation.map((item, idx) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const getShortcut = (index: number) => {
              if (index < 9) return `⌘${index + 1}`;
              if (index === 9) return `⌘0`;
              return null;
            };

            return (
              <div key={item.href} className="relative group flex items-center">
                {active && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-0.5 h-4 bg-primary rounded-full"
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
                      ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-border" 
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                  )}
                >
                  <Icon data-icon="inline-start" className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-sidebar-primary" : "text-muted-foreground")} />
                  <span className={cn("transition-opacity duration-300", collapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto")}>
                    {item.label}
                  </span>
                  {!collapsed && getShortcut(idx) && (
                    <kbd className="ml-auto hidden group-hover:inline-flex h-4.5 select-none items-center rounded border border-sidebar-border bg-background px-1.5 font-mono text-[9px] font-medium text-muted-foreground/40 transition-colors duration-200">
                      {getShortcut(idx)}
                    </kbd>
                  )}
                </Link>
                {/* Tooltip on Hover when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-lg font-mono uppercase tracking-wider whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className={cn("mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3.5 text-[10px] font-mono text-muted-foreground transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]", collapsed ? "opacity-0 h-0 p-0 overflow-hidden border-0" : "opacity-100")}>
          <div className="font-extrabold text-foreground tracking-wider">MOTHERXIP OS</div>
          <div className="text-[9px] mt-1 text-muted-foreground/60">MISSION CONTROL v12.5</div>
        </div>
      </aside>

      <div className={cn("transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground lg:hidden mr-1 cursor-pointer"
              aria-label="Abrir menu"
            >
              <MenuIcon className="size-4" />
            </button>
            <ClipboardListIcon className="text-primary size-4" data-icon="inline-start" />
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground font-mono">MOTHERXIP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <div className="font-medium text-foreground">{userEmail || "sem sessao"}</div>
              <div className="capitalize text-primary font-mono text-[9px] font-bold tracking-wider">{userRole ? roleLabel(userRole) : "profile pendente"}</div>
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-indigo-500" />}
            </button>
            {searchData ? <GlobalSearch data={searchData} /> : <Button variant="outline" size="sm">Search</Button>}
            <form action={logoutAction}>
              <Button size="sm" variant="secondary" className="border border-border bg-background hover:bg-muted text-foreground h-8 text-xs cursor-pointer" type="submit" disabled={!isAuthConfigured}>
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
