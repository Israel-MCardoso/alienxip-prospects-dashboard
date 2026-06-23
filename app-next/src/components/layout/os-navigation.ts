import {
  findActiveNavigation,
  flattenNavigation,
  navigationGroups
} from "./os-navigation.mjs";

export type NavigationIconName =
  | "BriefcaseBusinessIcon"
  | "Building2Icon"
  | "CalendarDaysIcon"
  | "ClipboardListIcon"
  | "FilesIcon"
  | "FileTextIcon"
  | "HistoryIcon"
  | "HomeIcon"
  | "LayoutDashboardIcon"
  | "LibraryIcon"
  | "ListTodoIcon"
  | "MessageSquareIcon"
  | "SettingsIcon"
  | "TargetIcon"
  | "WrenchIcon";

export type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIconName;
  group?: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export {
  findActiveNavigation,
  flattenNavigation,
  navigationGroups
};
