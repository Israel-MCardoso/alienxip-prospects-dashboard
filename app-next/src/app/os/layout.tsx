import { OsShell } from "@/components/layout/os-shell";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return <OsShell>{children}</OsShell>;
}
