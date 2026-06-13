"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CustomCheckbox({
  checked,
  onChange,
  disabled = false,
  className,
  id
}: CustomCheckboxProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={cn(
        "group relative flex items-center justify-center h-10 w-10 rounded-lg text-foreground focus:outline-none transition-all select-none cursor-pointer shrink-0",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Visual Box - centered with size h-4 w-4 for design matching, but within the h-10 w-10 button for 40px tap target */}
      <div
        className={cn(
          "flex h-4.5 w-4.5 items-center justify-center rounded border transition-all duration-200",
          checked
            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
            : "border-input bg-background group-hover:border-primary/50 group-focus:border-primary",
          disabled && "border-input bg-muted"
        )}
      >
        <CheckIcon
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  );
}
