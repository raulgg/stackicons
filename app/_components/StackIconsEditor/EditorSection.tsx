"use client";

import React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type EditorSectionKey = "icons" | "layout" | "spacing";

type EditorSectionProps = {
  children: React.ReactNode;
  isDone: boolean;
  isOpen: boolean;
  onToggle: () => void;
  sectionKey: EditorSectionKey;
  stepNumber: number;
  summary: string;
  title: string;
};

export function EditorSection({
  children,
  isDone,
  isOpen,
  onToggle,
  sectionKey,
  stepNumber,
  summary,
  title,
}: EditorSectionProps) {
  const bodyId = `editor-section-body-${sectionKey}`;

  return (
    <section className="overflow-hidden rounded-[6px] border bg-card text-card-foreground">
      <button
        aria-controls={bodyId}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3.5 px-5 py-[18px] text-left hover:bg-surface-2"
        data-testid={`editor-section-toggle-${sectionKey}`}
        onClick={onToggle}
        type="button"
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-bold",
            isDone ? "bg-accent text-white" : "bg-accent-soft text-accent-ink",
          )}
        >
          {isDone ? (
            <>
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Step {stepNumber} complete</span>
            </>
          ) : (
            stepNumber
          )}
        </span>
        <span className="text-[16.5px] font-semibold">{title}</span>
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
        <div className="px-5 pb-[22px] pt-0.5" id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
