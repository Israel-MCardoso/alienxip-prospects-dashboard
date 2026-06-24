"use client";

import * as React from "react";
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeValue = value !== undefined ? value : internalValue;

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

  // Close when the viewport scrolls so the fixed dropdown doesn't detach from its trigger.
  // Using default bubble phase (no capture) so inner container scrolls don't close the dropdown.
  React.useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === activeValue);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(!open);
  };

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    if (onChange) {
      onChange(val);
    }
    setOpen(false);
  };

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
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-50 ml-2 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in slide-in-from-top-1 duration-100 p-1 max-h-60 overflow-y-auto"
          style={dropdownStyle}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "relative flex w-full select-none items-center justify-between rounded-sm py-1.5 pl-3 pr-8 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer text-left",
                opt.value === activeValue && "bg-accent/60 font-semibold"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === activeValue && (
                <span className="absolute right-2 flex items-center justify-center">
                  <CheckIcon className="h-3.5 w-3.5 text-primary" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
