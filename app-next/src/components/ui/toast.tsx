"use client";

import * as React from "react";
import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

// Global manager so the `toast` helper works from anywhere (incl. event
// handlers reacting to Server Action results), mirroring sonner's API.
export const toastManager = Toast.createToastManager();

function emit(type: ToastVariant, message: string, description?: string): string {
  return toastManager.add({ title: message, description, type });
}

export const toast = {
  success: (message: string, description?: string) => emit("success", message, description),
  error: (message: string, description?: string) => emit("error", message, description),
  warning: (message: string, description?: string) => emit("warning", message, description),
  info: (message: string, description?: string) => emit("info", message, description),
};

type VariantStyle = {
  Icon: typeof CheckCircle2;
  iconClass: string;
  accentClass: string;
};

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  success: {
    Icon: CheckCircle2,
    iconClass: "text-emerald-400",
    accentClass: "before:bg-emerald-400/80",
  },
  error: {
    Icon: XCircle,
    iconClass: "text-rose-400",
    accentClass: "before:bg-rose-400/80",
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: "text-amber-400",
    accentClass: "before:bg-amber-400/80",
  },
  info: {
    Icon: Info,
    iconClass: "text-violet-400",
    accentClass: "before:bg-violet-400/80",
  },
};

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((item) => {
    const variant: ToastVariant = (item.type as ToastVariant) in VARIANTS ? (item.type as ToastVariant) : "info";
    const { Icon, iconClass, accentClass } = VARIANTS[variant];

    return (
      <Toast.Root
        key={item.id}
        toast={item}
        className={cn(
          "group relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b12]/95 px-4 py-3 pr-9 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl",
          // Accent rail on the left edge
          "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:content-['']",
          accentClass,
          // Enter / exit motion (compositor-friendly only)
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "data-[starting-style]:translate-x-3 data-[starting-style]:opacity-0",
          "data-[ending-style]:translate-x-3 data-[ending-style]:opacity-0",
        )}
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Toast.Title className="text-[13px] font-medium leading-snug text-zinc-50" />
          <Toast.Description className="text-xs leading-snug text-zinc-400" />
        </div>
        <Toast.Close
          aria-label="Fechar"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={5000} limit={4}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 top-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
