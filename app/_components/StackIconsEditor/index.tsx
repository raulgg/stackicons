"use client";

import Image from "next/image";
import React from "react";
import {
  CheckIcon,
  CopyIcon,
  ImageIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getEditableBaseColumnLayout,
  getEditableBreakpointColumnLayouts,
} from "@/lib/icons/column-layout";
import type { GeneratedImageSource } from "@/lib/icons/readme-image";
import { cn } from "@/lib/utils";
import type { StackIconsEditorState } from "./state";
import { useStackIconsEditorForm } from "./useStackIconsEditorForm";

export type { StackIconsEditorState } from "./state";

type StackIconsEditorProps = {
  initialState: StackIconsEditorState;
};

export function StackIconsEditor({ initialState }: StackIconsEditorProps) {
  const {
    addBreakpointLayout,
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    copyImageUrl,
    copyImageUrlStatusByKey,
    generatedHtml,
    generatedImageSources,
    generatedUrl,
    generatePreview,
    removeBreakpointLayout,
    state,
    switchLayoutMode,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  } = useStackIconsEditorForm(initialState);

  const hasValidationErrors = validationErrors.length > 0;
  const baseColumnLayout = getEditableBaseColumnLayout(state.columnLayouts);
  const breakpointLayouts = getEditableBreakpointColumnLayouts(
    state.columnLayouts,
  );

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

      <div className="mt-5 rounded-md border bg-background p-4">
        <fieldset>
          <legend className="font-mono text-xs text-muted-foreground">
            Layout mode
          </legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["single", "responsive"] as const).map((layoutMode) => (
              <label
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-xs text-card-foreground transition focus-within:ring-2 focus-within:ring-ring",
                  state.layoutMode === layoutMode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card",
                )}
                htmlFor={`layout-mode-${layoutMode}`}
                key={layoutMode}
              >
                <input
                  checked={state.layoutMode === layoutMode}
                  className="sr-only"
                  id={`layout-mode-${layoutMode}`}
                  name="layout-mode"
                  onChange={() => switchLayoutMode(layoutMode)}
                  type="radio"
                />
                {layoutMode === "single"
                  ? "Single layout"
                  : "Responsive layout"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <p className="font-mono text-xs text-muted-foreground">
            {state.layoutMode === "single" ? "Layout" : "Breakpoints"}
          </p>
          <div className="mt-2 grid gap-3">
            <div className="rounded-md border bg-card p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-medium text-card-foreground">
                      {state.layoutMode === "single"
                        ? "Default layout"
                        : "Default breakpoint"}
                    </p>
                    <span className="rounded border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                      All widths
                    </span>
                  </div>
                  <label
                    className="font-mono text-xs text-muted-foreground"
                    htmlFor="columns"
                  >
                    {state.layoutMode === "single"
                      ? "Columns"
                      : "Default columns"}
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
                    id="columns"
                    max={20}
                    min={2}
                    onChange={(event) => updateBaseColumns(event.target.value)}
                    type="number"
                    value={baseColumnLayout?.columns ?? ""}
                  />
                </div>
                <ImageUrlCopyButtons
                  copyImageUrl={copyImageUrl}
                  copyImageUrlStatusByKey={copyImageUrlStatusByKey}
                  label="default"
                  minWidthPx={null}
                  sources={generatedImageSources}
                />
              </div>
            </div>
            {state.layoutMode === "responsive"
              ? breakpointLayouts.map(({ layout, originalIndex }) => {
                  const isRemovable = breakpointLayouts.length > 1;
                  const breakpointLabel =
                    layout.minWidthPx === ""
                      ? "empty breakpoint"
                      : `${layout.minWidthPx}px breakpoint`;

                  return (
                    <div
                      className="rounded-md border bg-card p-3"
                      key={originalIndex}
                    >
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium text-card-foreground">
                            Breakpoint
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            Applies at this width and above.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <ImageUrlCopyButtons
                            copyImageUrl={copyImageUrl}
                            copyImageUrlStatusByKey={copyImageUrlStatusByKey}
                            label={`${layout.minWidthPx || "breakpoint"}px`}
                            minWidthPx={layout.minWidthPx}
                            sources={generatedImageSources}
                          />
                          {isRemovable ? (
                            <Button
                              aria-label={`Remove ${breakpointLabel}`}
                              className="w-full sm:w-10"
                              onClick={() =>
                                removeBreakpointLayout(originalIndex)
                              }
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              <Trash2Icon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            className="font-mono text-xs text-muted-foreground"
                            htmlFor={`breakpoint-columns-${originalIndex}`}
                          >
                            Columns
                          </label>
                          <input
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
                            id={`breakpoint-columns-${originalIndex}`}
                            max={20}
                            min={2}
                            onChange={(event) =>
                              updateColumnLayout(
                                originalIndex,
                                "columns",
                                event.target.value,
                              )
                            }
                            type="number"
                            value={layout.columns}
                          />
                        </div>
                        <div>
                          <label
                            className="font-mono text-xs text-muted-foreground"
                            htmlFor={`breakpoint-min-width-${originalIndex}`}
                          >
                            Min width px
                          </label>
                          <input
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
                            id={`breakpoint-min-width-${originalIndex}`}
                            max={3840}
                            min={1}
                            onChange={(event) =>
                              updateColumnLayout(
                                originalIndex,
                                "minWidthPx",
                                event.target.value,
                              )
                            }
                            type="number"
                            value={layout.minWidthPx ?? ""}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}
            {state.layoutMode === "responsive" ? (
              <Button
                className="w-full sm:w-fit"
                onClick={addBreakpointLayout}
                type="button"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Add breakpoint
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border bg-background p-4">
        <p className="font-mono text-xs text-muted-foreground">
          Global settings
        </p>
        <div className="mt-3 max-w-xs">
          <div>
            <label
              className="font-mono text-xs text-muted-foreground"
              htmlFor="gap"
            >
              Gap
            </label>
            <input
              className="mt-1 w-full rounded-md border bg-card px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
              id="gap"
              max={24}
              min={0}
              onChange={(event) => updateField("gap", event.target.value)}
              type="number"
              value={state.gap}
            />
          </div>
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

type ImageUrlCopyButtonsProps = {
  copyImageUrl: (source: GeneratedImageSource) => void;
  copyImageUrlStatusByKey: Record<string, "failed" | "idle" | "succeeded">;
  label: string;
  minWidthPx: string | number | null;
  sources: GeneratedImageSource[];
};

function ImageUrlCopyButtons({
  copyImageUrl,
  copyImageUrlStatusByKey,
  label,
  minWidthPx,
  sources,
}: ImageUrlCopyButtonsProps) {
  const normalizedMinWidthPx = normalizeMinWidthPx(minWidthPx);
  const layoutSources = sources.filter(
    (source) => source.minWidthPx === normalizedMinWidthPx,
  );
  const lightSource = layoutSources.find((source) => source.theme === "light");
  const darkSource = layoutSources.find((source) => source.theme === "dark");
  const hasGeneratedSources = sources.length > 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      <ImageUrlCopyButton
        copyImageUrl={copyImageUrl}
        label={`Copy ${label} light image URL`}
        source={lightSource}
        status={
          lightSource === undefined
            ? "idle"
            : copyImageUrlStatusByKey[getGeneratedImageSourceKey(lightSource)]
        }
        themeLabel="Light URL"
        wasGenerated={hasGeneratedSources}
      />
      <ImageUrlCopyButton
        copyImageUrl={copyImageUrl}
        label={`Copy ${label} dark image URL`}
        source={darkSource}
        status={
          darkSource === undefined
            ? "idle"
            : copyImageUrlStatusByKey[getGeneratedImageSourceKey(darkSource)]
        }
        themeLabel="Dark URL"
        wasGenerated={hasGeneratedSources}
      />
    </div>
  );
}

type ImageUrlCopyButtonProps = {
  copyImageUrl: (source: GeneratedImageSource) => void;
  label: string;
  source: GeneratedImageSource | undefined;
  status: "failed" | "idle" | "succeeded" | undefined;
  themeLabel: string;
  wasGenerated: boolean;
};

function ImageUrlCopyButton({
  copyImageUrl,
  label,
  source,
  status,
  themeLabel,
  wasGenerated,
}: ImageUrlCopyButtonProps) {
  const isDisabled = source === undefined;
  const buttonLabel =
    status === "succeeded"
      ? "Copied"
      : status === "failed"
        ? "Failed"
        : themeLabel;

  return (
    <Button
      aria-label={label}
      className="w-full sm:w-auto"
      disabled={isDisabled}
      onClick={() => {
        if (source !== undefined) {
          copyImageUrl(source);
        }
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      <CopyIcon className="h-4 w-4" aria-hidden="true" />
      {isDisabled && wasGenerated ? "Unavailable" : buttonLabel}
    </Button>
  );
}

function normalizeMinWidthPx(
  minWidthPx: string | number | null,
): number | null {
  if (minWidthPx === null) {
    return null;
  }

  const parsedMinWidthPx = Number(minWidthPx);

  return Number.isFinite(parsedMinWidthPx) ? parsedMinWidthPx : null;
}

function getGeneratedImageSourceKey(source: GeneratedImageSource): string {
  return `${source.minWidthPx ?? "default"}:${source.theme}`;
}
