"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  name?: string;
}

export function CustomSelect({
  value,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Selecione...",
  className,
  triggerClassName,
  name
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeValue = value !== undefined ? value : internalValue;

  // Only render portal after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Click outside closes dropdown — checks both trigger container and portal dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target) ?? false;
      const inDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!inContainer && !inDropdown) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on viewport scroll or resize — window-level only so inner container
  // scrolls (e.g. task lists) do not close the dropdown accidentally.
  React.useEffect(() => {
    if (!open) return;
    const handleClose = () => setOpen(false);
    window.addEventListener("scroll", handleClose);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose);
      window.removeEventListener("resize", handleClose);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === activeValue);

  const computePosition = (): React.CSSProperties => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    // 36px per option + 8px padding, capped at 240px
    const estimatedHeight = Math.min(options.length * 36 + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    return {
      position: "fixed",
      top: openAbove ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    };
  };

  const handleToggle = () => {
    if (!open) {
      setDropdownStyle(computePosition());
    }
    setOpen((prev) => !prev);
  };

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
    setOpen(false);
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="z-[9999] min-w-[8rem] rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-xl p-1 max-h-60 overflow-y-auto"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleSelect(opt.value)}
          className={cn(
            "relative flex w-full items-center justify-between rounded-sm py-1.5 pl-3 pr-8 text-xs outline-none transition-colors hover:bg-zinc-700 hover:text-white cursor-pointer text-left text-zinc-100",
            opt.value === activeValue && "bg-zinc-700/60 font-semibold"
          )}
        >
          <span className="truncate">{opt.label}</span>
          {opt.value === activeValue && (
            <span className="absolute right-2 flex items-center justify-center">
              <CheckIcon className="h-3.5 w-3.5 text-purple-400" />
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {name && <input type="hidden" name={name} value={activeValue} />}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm ring-offset-background transition-colors hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer",
          triggerClassName
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDownIcon
          className="h-3.5 w-3.5 shrink-0 opacity-50 ml-2 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  );
}
