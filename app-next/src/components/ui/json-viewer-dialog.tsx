"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CopyIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface JsonViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value: unknown;
}

// Serializes any value safely for display. Falls back to a friendly message
// when the value cannot be turned into JSON (e.g. circular references).
function serializeJson(value: unknown): { text: string; serializable: boolean } {
  if (value === undefined) {
    return { text: "undefined", serializable: false };
  }
  try {
    const text = JSON.stringify(value, null, 2);
    if (text === undefined) {
      return { text: String(value), serializable: false };
    }
    return { text, serializable: true };
  } catch {
    return { text: "Conteúdo não pôde ser exibido como JSON.", serializable: false };
  }
}

export function JsonViewerDialog({ open, onOpenChange, title, description, value }: JsonViewerDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const { text, serializable } = serializeJson(value);

  // Reset the transient "copied" state whenever the dialog reopens.
  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("JSON copiado.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o JSON.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
            "fixed left-1/2 top-1/2 z-[9999] flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60 outline-none",
            "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Dialog.Title className="text-sm font-semibold tracking-tight text-zinc-50">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-xs text-zinc-400">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Fechar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60 cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-5">
            <pre
              className={cn(
                "max-h-full overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed",
                serializable ? "text-zinc-200" : "text-zinc-400 italic",
              )}
            >
              {text}
            </pre>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60 cursor-pointer"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar JSON"}
            </button>
            <Dialog.Close className="inline-flex h-8 items-center rounded-md bg-violet-600 px-3 text-xs font-medium text-white transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60 cursor-pointer">
              Fechar
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
