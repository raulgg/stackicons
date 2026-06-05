"use client";

import Image from "next/image";
import React from "react";
import {
  CheckIcon,
  CopyIcon,
  ImageIcon,
  LinkIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StackIconsEditorState } from "./state";
import { useStackIconsEditorForm } from "./useStackIconsEditorForm";

export type { StackIconsEditorState } from "./state";

type StackIconsEditorProps = {
  initialState: StackIconsEditorState;
};

export function StackIconsEditor({ initialState }: StackIconsEditorProps) {
  const {
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    generatedHtml,
    generatedUrl,
    generatePreview,
    state,
    updateField,
    validationErrors,
  } = useStackIconsEditorForm(initialState);

  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <label
        className="font-mono text-sm font-medium text-card-foreground"
        htmlFor="icons"
      >
        Icon slugs
      </label>
      <textarea
        className="mt-3 min-h-40 w-full resize-none rounded-md border bg-background p-4 font-mono text-sm outline-none ring-ring transition focus:ring-2"
        id="icons"
        onChange={(event) => updateField("icons", event.target.value)}
        value={state.icons}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            className="font-mono text-xs text-muted-foreground"
            htmlFor="columns"
          >
            Columns
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
            id="columns"
            max={20}
            min={2}
            onChange={(event) => updateField("columns", event.target.value)}
            type="number"
            value={state.columns}
          />
        </div>
        <div>
          <label
            className="font-mono text-xs text-muted-foreground"
            htmlFor="gap"
          >
            Gap
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
            id="gap"
            max={24}
            min={0}
            onChange={(event) => updateField("gap", event.target.value)}
            type="number"
            value={state.gap}
          />
        </div>
      </div>

      <div className="mt-4 rounded-md border bg-background px-3 py-2">
        <label
          className="flex items-center gap-3 font-mono text-sm font-medium text-card-foreground"
          htmlFor="include-dark-theme"
        >
          <input
            checked={state.includeDarkTheme}
            className="h-4 w-4 rounded border bg-background text-primary ring-ring transition focus:ring-2"
            id="include-dark-theme"
            onChange={(event) =>
              updateField("includeDarkTheme", event.target.checked)
            }
            type="checkbox"
          />
          Include dark theme source
        </label>
      </div>

      <div className="mt-4 rounded-md border bg-background px-3 py-3">
        <label
          className="flex items-center gap-3 font-mono text-sm font-medium text-card-foreground"
          htmlFor="responsive"
        >
          <input
            checked={state.responsive}
            className="h-4 w-4 rounded border bg-background text-primary ring-ring transition focus:ring-2"
            id="responsive"
            onChange={(event) =>
              updateField("responsive", event.target.checked)
            }
            type="checkbox"
          />
          Include responsive sources
        </label>

        <div className="mt-3">
          <label
            className="font-mono text-xs text-muted-foreground"
            htmlFor="mobile-columns"
          >
            Mobile columns
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!state.responsive}
            id="mobile-columns"
            max={20}
            min={2}
            onChange={(event) =>
              updateField("mobileColumns", event.target.value)
            }
            type="number"
            value={state.mobileColumns}
          />
        </div>
      </div>

      <Button className="mt-5 w-full" onClick={generatePreview} type="button">
        <WandSparklesIcon className="h-4 w-4" aria-hidden="true" />
        Generate Preview
      </Button>

      {hasValidationErrors ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-md border border-accent/60 bg-accent/10 px-3 py-2 font-mono text-sm text-foreground"
          role="alert"
        >
          <ul className="grid gap-1">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <label
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
          htmlFor="generated-url"
        >
          <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          SVG URL
        </label>
        <input
          className="mt-1 w-full rounded-md border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground"
          id="generated-url"
          placeholder="Generate a preview to create the SVG URL"
          readOnly
          type="text"
          value={generatedUrl}
        />
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
            htmlFor="generated-readme-html"
          >
            <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            README HTML
          </label>
          {generatedHtml === "" ? null : (
            <Button
              className="w-full sm:w-auto"
              onClick={copyGeneratedHtml}
              size="sm"
              type="button"
              variant="outline"
            >
              <CopyIcon className="h-4 w-4" aria-hidden="true" />
              Copy HTML
            </Button>
          )}
        </div>
        <textarea
          className="mt-1 min-h-28 w-full resize-none rounded-md border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground"
          id="generated-readme-html"
          placeholder="Generate a preview to create the README HTML"
          readOnly
          value={generatedHtml}
        />
        {copyGeneratedHtmlStatus === "succeeded" ? (
          <p
            aria-live="polite"
            className="mt-2 flex items-center gap-2 font-mono text-xs text-green-700"
          >
            <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
            HTML copied.
          </p>
        ) : null}
        {copyGeneratedHtmlStatus === "failed" ? (
          <p
            aria-live="polite"
            className="mt-2 flex items-center gap-2 font-mono text-xs text-destructive"
          >
            <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Could not copy HTML.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <div
          className={cn(
            "rounded-md border p-3 transition-colors",
            state.previewTheme === "dark"
              ? "border-slate-700 bg-[#0d1117]"
              : "bg-background",
          )}
          data-testid="preview-box"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Preview
            </p>
            <fieldset>
              <legend className="sr-only">Preview theme</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["light", "dark"] as const).map((theme) => (
                  <label
                    className="flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs text-card-foreground"
                    htmlFor={`preview-theme-${theme}`}
                    key={theme}
                  >
                    <input
                      checked={state.previewTheme === theme}
                      className="h-4 w-4 border bg-background text-primary ring-ring transition focus:ring-2"
                      id={`preview-theme-${theme}`}
                      name="preview-theme"
                      onChange={() => updateField("previewTheme", theme)}
                      type="radio"
                    />
                    {theme === "light" ? "Light" : "Dark"}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          {generatedUrl === "" ? (
            <div
              className={cn(
                "mt-3 rounded-md border px-3 py-8 text-center font-mono text-sm",
                state.previewTheme === "dark"
                  ? "border-slate-700 bg-slate-900 text-slate-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Generate a preview to render the SVG image
            </div>
          ) : (
            <div className="mt-3 overflow-auto">
              <Image
                alt="Generated stack icons preview"
                className="h-auto w-auto max-w-none"
                height={160}
                src={generatedUrl}
                unoptimized
                width={640}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
