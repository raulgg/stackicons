"use client";

import { useTheme } from "next-themes";
import React from "react";

import { cn } from "@/lib/utils";

type UiTheme = "dark" | "light";

const subscribeToNothing = () => () => {};

// Hydration-safe mount detection: the server snapshot is false, the client
// snapshot is true, and React reconciles the difference after hydration
// without a mismatch warning.
function useHasMounted() {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Segmented Light/Dark control for the UI chrome theme (next-themes).
 * Deliberately separate from the editor's preview theme, which is URL state.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hasMounted = useHasMounted();

  // next-themes resolves the theme only on the client; until mounted, render
  // both buttons unpressed so server and client markup match.
  const activeTheme: UiTheme | undefined = hasMounted
    ? resolvedTheme === "dark"
      ? "dark"
      : "light"
    : undefined;

  return (
    <div
      aria-label="UI theme"
      className="inline-flex items-center gap-[3px] rounded-[6px] border bg-surface-3 p-[3px]"
      role="group"
    >
      <ThemeToggleButton
        isActive={activeTheme === "light"}
        label="Light"
        onActivate={() => setTheme("light")}
      >
        <SunIcon />
      </ThemeToggleButton>
      <ThemeToggleButton
        isActive={activeTheme === "dark"}
        label="Dark"
        onActivate={() => setTheme("dark")}
      >
        <MoonIcon />
      </ThemeToggleButton>
    </div>
  );
}

type ThemeToggleButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  label: string;
  onActivate: () => void;
};

function ThemeToggleButton({
  children,
  isActive,
  label,
  onActivate,
}: ThemeToggleButtonProps) {
  return (
    <button
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[7px] border-0 bg-transparent px-[13px] py-[7px] text-[13px] font-semibold text-ink-2 transition-[color] duration-[140ms] hover:text-ink",
        isActive &&
          "bg-background text-ink shadow-button dark:bg-[hsl(var(--button-bg-hover))]",
      )}
      onClick={onActivate}
      type="button"
    >
      {children}
      {label}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
    >
      <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
