"use client";

import { useOptimistic, useTransition } from "react";
import { UserIcon } from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";
import { assignProspectResponsibleAction } from "./actions";
import type { ProfileRow } from "@/features/workspace/data";

const NONE_VALUE = "__none__";

type Props = {
  prospectId: string;
  initialResponsibleUserId: string | null;
  profiles: ProfileRow[];
};

export function AssignResponsibleSelect({
  prospectId,
  initialResponsibleUserId,
  profiles
}: Props) {
  const initialValue = initialResponsibleUserId ?? NONE_VALUE;
  const [optimisticValue, setOptimisticValue] = useOptimistic<string>(initialValue);
  const [isPending, startTransition] = useTransition();

  const options = [
    { value: NONE_VALUE, label: "Não definido" },
    ...profiles.map((profile) => ({
      value: profile.id,
      label: profile.full_name || profile.email || "Membro"
    }))
  ];

  const handleChange = (next: string) => {
    if (next === optimisticValue) return;
    const responsibleUserId = next === NONE_VALUE ? null : next;
    startTransition(async () => {
      setOptimisticValue(next);
      try {
        await assignProspectResponsibleAction(prospectId, responsibleUserId);
      } catch (err) {
        alert(
          "Erro ao atribuir responsável: " +
            (err instanceof Error ? err.message : String(err))
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-zinc-500 uppercase">Responsável</span>
      <div className="flex items-center gap-1.5">
        <UserIcon className="size-3.5 text-purple-400 shrink-0" />
        <CustomSelect
          value={optimisticValue}
          options={options}
          onChange={handleChange}
          triggerClassName={`h-8 border-white/5 bg-zinc-950/40 text-xs text-white ${
            isPending ? "opacity-60 pointer-events-none" : ""
          }`}
        />
      </div>
    </div>
  );
}
