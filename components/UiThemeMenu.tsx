"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

import { cn } from "@/lib/utils";

type UiThemePreference = "dark" | "light" | "system";

const uiThemeOptions = [
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
  { icon: MonitorIcon, label: "System", value: "system" },
] as const;

/**
 * Dropdown menu for the UI theme preference (next-themes): light, dark, or
 * system. Deliberately separate from the editor's preview theme, which is URL
 * state. The trigger icon follows the resolved theme through the `dark:`
 * classes — next-themes sets the root class before paint, so server and
 * client markup match without a mounted gate.
 */
export function UiThemeMenu() {
  const { setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDownOutside(event: MouseEvent | TouchEvent) {
      const container = containerRef.current;

      if (
        container !== null &&
        event.target instanceof Node &&
        !container.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
    };
  }, [isOpen]);

  function selectUiTheme(preference: UiThemePreference) {
    setTheme(preference);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="UI theme"
        className="inline-flex items-center gap-1.5 rounded-[6px] border bg-surface-3 px-[11px] py-[8px] text-ink-2 transition-[color] duration-[140ms] hover:text-ink"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        type="button"
      >
        <SunIcon aria-hidden className="dark:hidden" size={16} />
        <MoonIcon aria-hidden className="hidden dark:block" size={16} />
        <ChevronDownIcon aria-hidden size={14} />
      </button>
      {isOpen ? (
        <div
          aria-label="UI theme"
          className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[164px] rounded-[6px] border border-border-strong bg-popover p-[5px] text-popover-foreground shadow-overlay"
          role="menu"
        >
          {uiThemeOptions.map((option) => {
            const isSelected = theme === option.value;

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[5px] px-[9px] py-[7px] text-[13px] font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink",
                  isSelected && "text-ink",
                )}
                key={option.value}
                onClick={() => selectUiTheme(option.value)}
                role="menuitemradio"
                type="button"
              >
                <option.icon aria-hidden size={16} />
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected ? <CheckIcon aria-hidden size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
