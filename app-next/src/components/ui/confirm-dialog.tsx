"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmVariant = "default" | "warning" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
}

const CONFIRM_BUTTON: Record<ConfirmVariant, string> = {
  default: "bg-violet-600 hover:bg-violet-500",
  warning: "bg-amber-600 hover:bg-amber-500",
  danger: "bg-rose-600 hover:bg-rose-500",
};

const ACCENT_ICON: Record<ConfirmVariant, string> = {
  default: "text-violet-400",
  warning: "text-amber-400",
  danger: "text-rose-400",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  // Execution and error handling are owned by the caller (so it can show its
  // own toast). We only fire the callback — we never swallow its result.
  const handleConfirm = () => {
    void onConfirm();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        // Block closing via Esc/overlay while the action is in flight.
        if (isPending && !next) return;
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm",
            "transition-opacity duration-200",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[9999] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4",
            "rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/60 outline-none",
            "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
          )}
        >
          <div className="flex items-start gap-3">
            {variant !== "default" ? (
              <AlertTriangleIcon className={cn("mt-0.5 h-5 w-5 shrink-0", ACCENT_ICON[variant])} aria-hidden="true" />
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="text-sm font-semibold tracking-tight text-zinc-50">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-xs leading-relaxed text-zinc-400">{description}</Dialog.Description>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Dialog.Close
              disabled={isPending}
              className="inline-flex h-8 items-center rounded-md border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
                CONFIRM_BUTTON[variant],
              )}
            >
              {isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
