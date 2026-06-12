"use client";

import React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type EditorSectionKey = "icons" | "layout" | "spacing";

type EditorSectionProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  sectionKey: EditorSectionKey;
  summary: string;
  title: string;
};

// Collapsible editor card with a GitHub file-list-style header: gray bar,
// section icon + title on the left, live summary as right-side metadata.
export function EditorSection({
  children,
  icon,
  isOpen,
  onToggle,
  sectionKey,
  summary,
  title,
}: EditorSectionProps) {
  const bodyId = `editor-section-body-${sectionKey}`;

  return (
    <section className="overflow-hidden rounded-[6px] border bg-card text-card-foreground">
      <button
        aria-controls={bodyId}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-2.5 bg-surface-2 px-5 py-[13px] text-left hover:bg-surface-3",
          isOpen && "border-b",
        )}
        data-testid={`editor-section-toggle-${sectionKey}`}
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden="true" className="shrink-0 text-ink-2">
          {icon}
        </span>
        <span className="text-sm font-semibold">{title}</span>
        <span
          className="ml-auto hidden min-w-0 max-w-[46%] truncate font-mono text-xs text-ink-3 sm:block"
          data-testid={`editor-section-summary-${sectionKey}`}
        >
          {summary}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-ink-3 transition-transform duration-[180ms]",
            !isOpen && "-rotate-90",
          )}
        />
      </button>
      {isOpen ? (
        <div className="px-5 pb-[22px] pt-[18px]" id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
