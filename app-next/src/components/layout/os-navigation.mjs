export const navigationGroups = [
  {
    label: "Início",
    items: [
      { href: "/os", label: "Controle de Missão", icon: "HomeIcon" },
      { href: "/os/dashboard", label: "Painel", icon: "LayoutDashboardIcon" }
    ]
  },
  {
    label: "CRM",
    items: [
      { href: "/os/prospects", label: "Prospects", icon: "TargetIcon" },
      { href: "/os/prospects/pipeline", label: "Funil", icon: "ClipboardListIcon" },
      { href: "/os/companies", label: "Empresas", icon: "Building2Icon" },
      { href: "/os/clients", label: "Clientes", icon: "Building2Icon" }
    ]
  },
  {
    label: "Outreach",
    items: [
      { href: "/os/outreach/sdr-command-center", label: "Central de Comando SDR", icon: "MessageSquareIcon" },
      { href: "/os/outreach", label: "Central de Outreach", icon: "MessageSquareIcon" },
      { href: "/os/outreach/settings", label: "Configurações de Outreach", icon: "SettingsIcon" }
    ]
  },
  {
    label: "Operação",
    items: [
      { href: "/os/projects", label: "Projetos", icon: "BriefcaseBusinessIcon" },
      { href: "/os/tasks", label: "Tarefas", icon: "ListTodoIcon" },
      { href: "/os/calendar", label: "Calendário", icon: "CalendarDaysIcon" },
      { href: "/os/activity", label: "Atividades", icon: "HistoryIcon" }
    ]
  },
  {
    label: "Conhecimento",
    items: [
      { href: "/os/wiki", label: "Wiki", icon: "LibraryIcon" },
      { href: "/os/playbooks", label: "Playbooks", icon: "FileTextIcon" },
      { href: "/os/files", label: "Arquivos", icon: "FilesIcon" }
    ]
  },
  {
    label: "Tecnologia",
    items: [
      { href: "/os/tech", label: "Central de Tecnologia", icon: "WrenchIcon" },
      { href: "/os/tech/bugs", label: "Bugs", icon: "WrenchIcon" },
      { href: "/os/tech/incidents", label: "Incidentes", icon: "WrenchIcon" },
      { href: "/os/tech/backlog", label: "Backlog", icon: "ListTodoIcon" },
      { href: "/os/tech/roadmap", label: "Roadmap", icon: "ClipboardListIcon" },
      { href: "/os/tech/decisions", label: "Decisões", icon: "LibraryIcon" }
    ]
  },
  {
    label: "Configurações",
    items: [
      { href: "/os/settings", label: "Configurações gerais", icon: "SettingsIcon" }
    ]
  }
];

export function flattenNavigation(groups = navigationGroups) {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/os";
  return pathname.replace(/\/+$/, "") || "/os";
}

export function findActiveNavigation(pathname, groups = navigationGroups) {
  const current = normalizePath(pathname);
  const items = flattenNavigation(groups);

  const match = items
    .filter((item) => {
      const href = normalizePath(item.href);
      if (href === "/os") return current === "/os";
      return current === href || current.startsWith(`${href}/`);
    })
    .sort((a, b) => normalizePath(b.href).length - normalizePath(a.href).length)[0] ?? null;

  if (!match) return null;

  return {
    group: match.group,
    item: match
  };
}
