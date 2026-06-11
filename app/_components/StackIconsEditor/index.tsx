"use client";

import Image from "next/image";
import React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EyeIcon,
  ImageIcon,
  LinkIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

type PreviewTarget = {
  label: string;
  minWidthPx: string | number | null;
};
type StackIconsEditorFieldValidation = {
  baseColumns: string[];
  gap: string[];
  icons: string[];
  layout: string[];
  breakpointColumnsByIndex: Record<number, string[]>;
  breakpointMinWidthByIndex: Record<number, string[]>;
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
    hasGeneratedOutput,
    removeBreakpointLayout,
    state,
    switchLayoutMode,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  } = useStackIconsEditorForm(initialState);
  const [previewTarget, setPreviewTarget] =
    React.useState<PreviewTarget | null>(null);
  const [copyPageLinkStatus, setCopyPageLinkStatus] = React.useState<
    "failed" | "idle" | "succeeded"
  >("idle");

  async function copyPageLink() {
    const clipboard = navigator.clipboard;

    if (clipboard === undefined) {
      setCopyPageLinkStatus("failed");
      return;
    }

    try {
      await clipboard.writeText(window.location.href);
      setCopyPageLinkStatus("succeeded");
    } catch {
      setCopyPageLinkStatus("failed");
    }
  }

  const baseColumnLayout = getEditableBaseColumnLayout(state.columnLayouts);
  const breakpointLayouts = getEditableBreakpointColumnLayouts(
    state.columnLayouts,
  );
  const fieldValidation = getStackIconsEditorFieldValidation({
    state,
    validationErrors,
  });

  return (
    <TooltipProvider>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="font-mono text-base">
                  README image editor
                </CardTitle>
                <CardDescription className="font-mono">
                  Compose icon slugs and configure column layouts.
                </CardDescription>
              </div>
              <Button
                className="w-fit"
                onClick={copyPageLink}
                size="sm"
                type="button"
                variant="outline"
              >
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
                Copy link
              </Button>
            </div>
            {copyPageLinkStatus === "succeeded" ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 font-mono text-xs text-card-foreground sm:justify-end"
              >
                <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Link copied.
              </p>
            ) : null}
            {copyPageLinkStatus === "failed" ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 font-mono text-xs text-destructive sm:justify-end"
              >
                <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Could not copy link.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field data-invalid={hasErrors(fieldValidation.icons) || undefined}>
              <FieldLabel
                className="font-mono text-sm text-card-foreground"
                htmlFor="icons"
              >
                Icon slugs
              </FieldLabel>
              <Textarea
                className="mt-3 min-h-40 resize-none font-mono"
                aria-describedby={
                  hasErrors(fieldValidation.icons) ? "icons-error" : undefined
                }
                aria-invalid={hasErrors(fieldValidation.icons) || undefined}
                id="icons"
                onChange={(event) => updateField("icons", event.target.value)}
                value={state.icons}
              />
              <FieldError errors={fieldValidation.icons} id="icons-error" />
            </Field>

            <Separator />

            <fieldset>
              <legend className="font-mono text-xs text-muted-foreground">
                Layout mode
              </legend>
              <ToggleGroup
                aria-label="Layout mode"
                className="mt-2 grid grid-cols-2"
                onValueChange={(layoutMode) => {
                  if (layoutMode === "single" || layoutMode === "responsive") {
                    switchLayoutMode(layoutMode);
                  }
                }}
                type="single"
                value={state.layoutMode}
              >
                <ToggleGroupItem
                  aria-label="Single layout"
                  className="w-full font-mono"
                  value="single"
                >
                  Single layout
                </ToggleGroupItem>
                <ToggleGroupItem
                  aria-label="Responsive layout"
                  className="w-full font-mono"
                  value="responsive"
                >
                  Responsive layout
                </ToggleGroupItem>
              </ToggleGroup>
            </fieldset>

            <div>
              <p className="font-mono text-xs text-muted-foreground">
                Column layouts
              </p>
              <FieldError
                errors={fieldValidation.layout}
                id="column-layouts-error"
              />
              <div className="mt-2 grid gap-3">
                <ColumnLayoutRow
                  actionsLabel="base layout"
                  badgeLabel="All widths"
                  copyImageUrl={copyImageUrl}
                  copyImageUrlStatusByKey={copyImageUrlStatusByKey}
                  generatedImageSources={generatedImageSources}
                  hasGeneratedOutput={hasGeneratedOutput}
                  minWidthPx={null}
                  onOpenPreview={() =>
                    setPreviewTarget({
                      label: "Base layout",
                      minWidthPx: null,
                    })
                  }
                  title="Base layout"
                >
                  <Field
                    data-invalid={
                      hasErrors(fieldValidation.baseColumns) || undefined
                    }
                  >
                    <FieldLabel
                      className="font-mono text-xs text-muted-foreground"
                      htmlFor="columns"
                    >
                      Columns
                    </FieldLabel>
                    <Input
                      className="mt-1 font-mono"
                      aria-describedby={
                        hasErrors(fieldValidation.baseColumns)
                          ? "base-columns-error"
                          : undefined
                      }
                      aria-invalid={
                        hasErrors(fieldValidation.baseColumns) || undefined
                      }
                      id="columns"
                      max={20}
                      min={2}
                      onChange={(event) =>
                        updateBaseColumns(event.target.value)
                      }
                      type="number"
                      value={baseColumnLayout?.columns ?? ""}
                    />
                    <FieldError
                      errors={fieldValidation.baseColumns}
                      id="base-columns-error"
                    />
                  </Field>
                </ColumnLayoutRow>

                {state.layoutMode === "responsive"
                  ? breakpointLayouts.map(({ layout, originalIndex }) => {
                      const isRemovable = breakpointLayouts.length > 1;
                      const breakpointLabel =
                        layout.minWidthPx === ""
                          ? "breakpoint"
                          : `${layout.minWidthPx}px`;
                      const badgeLabel =
                        layout.minWidthPx === ""
                          ? "Missing min width"
                          : `${layout.minWidthPx}px and up`;

                      return (
                        <ColumnLayoutRow
                          actionsLabel={breakpointLabel}
                          badgeLabel={badgeLabel}
                          copyImageUrl={copyImageUrl}
                          copyImageUrlStatusByKey={copyImageUrlStatusByKey}
                          generatedImageSources={generatedImageSources}
                          hasGeneratedOutput={hasGeneratedOutput}
                          key={originalIndex}
                          minWidthPx={layout.minWidthPx}
                          onOpenPreview={() =>
                            setPreviewTarget({
                              label:
                                layout.minWidthPx === ""
                                  ? "Breakpoint"
                                  : `${layout.minWidthPx}px breakpoint`,
                              minWidthPx: layout.minWidthPx,
                            })
                          }
                          onRemove={
                            isRemovable
                              ? () => removeBreakpointLayout(originalIndex)
                              : undefined
                          }
                          title="Breakpoint"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                              data-invalid={
                                hasErrors(
                                  fieldValidation.breakpointColumnsByIndex[
                                    originalIndex
                                  ],
                                ) || undefined
                              }
                            >
                              <FieldLabel
                                className="font-mono text-xs text-muted-foreground"
                                htmlFor={`breakpoint-columns-${originalIndex}`}
                              >
                                Columns
                              </FieldLabel>
                              <Input
                                className="mt-1 font-mono"
                                aria-describedby={
                                  hasErrors(
                                    fieldValidation.breakpointColumnsByIndex[
                                      originalIndex
                                    ],
                                  )
                                    ? `breakpoint-columns-error-${originalIndex}`
                                    : undefined
                                }
                                aria-invalid={
                                  hasErrors(
                                    fieldValidation.breakpointColumnsByIndex[
                                      originalIndex
                                    ],
                                  ) || undefined
                                }
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
                              <FieldError
                                errors={
                                  fieldValidation.breakpointColumnsByIndex[
                                    originalIndex
                                  ] ?? []
                                }
                                id={`breakpoint-columns-error-${originalIndex}`}
                              />
                            </Field>
                            <Field
                              data-invalid={
                                hasErrors(
                                  fieldValidation.breakpointMinWidthByIndex[
                                    originalIndex
                                  ],
                                ) || undefined
                              }
                            >
                              <FieldLabel
                                className="font-mono text-xs text-muted-foreground"
                                htmlFor={`breakpoint-min-width-${originalIndex}`}
                              >
                                Min width
                              </FieldLabel>
                              <Input
                                className="mt-1 font-mono"
                                aria-describedby={
                                  hasErrors(
                                    fieldValidation.breakpointMinWidthByIndex[
                                      originalIndex
                                    ],
                                  )
                                    ? `breakpoint-min-width-error-${originalIndex}`
                                    : undefined
                                }
                                aria-invalid={
                                  hasErrors(
                                    fieldValidation.breakpointMinWidthByIndex[
                                      originalIndex
                                    ],
                                  ) || undefined
                                }
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
                              <FieldError
                                errors={
                                  fieldValidation.breakpointMinWidthByIndex[
                                    originalIndex
                                  ] ?? []
                                }
                                id={`breakpoint-min-width-error-${originalIndex}`}
                              />
                            </Field>
                          </div>
                        </ColumnLayoutRow>
                      );
                    })
                  : null}
              </div>

              {state.layoutMode === "responsive" ? (
                <Button
                  className="mt-3 w-full sm:w-fit"
                  onClick={addBreakpointLayout}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  Add breakpoint
                </Button>
              ) : null}
            </div>

            <Separator />

            <Field
              className="max-w-xs"
              data-invalid={hasErrors(fieldValidation.gap) || undefined}
            >
              <FieldLabel
                className="font-mono text-xs text-muted-foreground"
                htmlFor="gap"
              >
                Gap
              </FieldLabel>
              <Input
                className="mt-1 font-mono"
                aria-describedby={
                  hasErrors(fieldValidation.gap) ? "gap-error" : undefined
                }
                aria-invalid={hasErrors(fieldValidation.gap) || undefined}
                id="gap"
                max={24}
                min={0}
                onChange={(event) => updateField("gap", event.target.value)}
                type="number"
                value={state.gap}
              />
              <FieldError errors={fieldValidation.gap} id="gap-error" />
            </Field>
          </CardContent>
        </Card>

        <aside className="grid gap-5 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">
                Generated README image code
              </CardTitle>
              <CardDescription className="font-mono">
                Generated from the current valid editor settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
                  <Label
                    className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
                    htmlFor="generated-readme-html"
                  >
                    <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    README image code
                  </Label>
                  {generatedHtml === "" ? null : (
                    <Button
                      className="w-full sm:w-auto lg:w-full xl:w-auto"
                      onClick={copyGeneratedHtml}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <CopyIcon className="h-4 w-4" aria-hidden="true" />
                      Copy README image code
                    </Button>
                  )}
                </div>
                <Textarea
                  className="mt-2 min-h-48 resize-none bg-muted font-mono text-muted-foreground"
                  id="generated-readme-html"
                  placeholder="Fix validation errors to create README image code."
                  readOnly
                  value={generatedHtml}
                />
                {copyGeneratedHtmlStatus === "succeeded" ? (
                  <p
                    aria-live="polite"
                    className="mt-2 flex items-center gap-2 font-mono text-xs text-green-700"
                  >
                    <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    README image code copied.
                  </p>
                ) : null}
                {copyGeneratedHtmlStatus === "failed" ? (
                  <p
                    aria-live="polite"
                    className="mt-2 flex items-center gap-2 font-mono text-xs text-destructive"
                  >
                    <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    Could not copy README image code.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>

        <ColumnLayoutPreviewDialog
          generatedImageSources={generatedImageSources}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewTarget(null);
            }
          }}
          previewTarget={previewTarget}
          previewTheme={state.previewTheme}
          updatePreviewTheme={(previewTheme) =>
            updateField("previewTheme", previewTheme)
          }
        />
      </div>
    </TooltipProvider>
  );
}

type FieldErrorProps = {
  errors: readonly string[] | undefined;
  id: string;
};

function FieldError({ errors, id }: FieldErrorProps) {
  if (!hasErrors(errors)) {
    return null;
  }

  return (
    <FieldDescription
      aria-live="polite"
      className="font-mono text-destructive"
      id={id}
    >
      {errors.join(" ")}
    </FieldDescription>
  );
}

function getStackIconsEditorFieldValidation({
  state,
  validationErrors,
}: {
  state: StackIconsEditorState;
  validationErrors: readonly string[];
}): StackIconsEditorFieldValidation {
  const fieldValidation: StackIconsEditorFieldValidation = {
    baseColumns: [],
    breakpointColumnsByIndex: {},
    breakpointMinWidthByIndex: {},
    gap: validationErrors.filter(isGapValidationError),
    icons: validationErrors.filter(isIconsValidationError),
    layout: validationErrors.filter(isLayoutValidationError),
  };
  const minWidthLayoutsByValue = new Map<string, number[]>();

  state.columnLayouts.forEach((layout, index) => {
    if (layout.minWidthPx === null) {
      if (!isIntegerInRange(layout.columns, 2, 20)) {
        fieldValidation.baseColumns.push(
          "Columns must be an integer from 2 to 20.",
        );
      }
      return;
    }

    const columnsErrors: string[] = [];
    const minWidthErrors: string[] = [];
    const hasColumns = layout.columns !== "";
    const hasMinWidth = layout.minWidthPx !== "";

    if (hasMinWidth && !hasColumns) {
      columnsErrors.push("Columns are required when min width is set.");
    } else if (hasColumns && !isIntegerInRange(layout.columns, 2, 20)) {
      columnsErrors.push("Columns must be an integer from 2 to 20.");
    }

    if (hasColumns && !hasMinWidth) {
      minWidthErrors.push("Min width is required when columns are set.");
    } else if (hasMinWidth && !isIntegerInRange(layout.minWidthPx, 1, 3840)) {
      minWidthErrors.push("Min width must be an integer from 1 to 3840.");
    }

    if (isIntegerInRange(layout.minWidthPx, 1, 3840)) {
      minWidthLayoutsByValue.set(layout.minWidthPx, [
        ...(minWidthLayoutsByValue.get(layout.minWidthPx) ?? []),
        index,
      ]);
    }

    fieldValidation.breakpointColumnsByIndex[index] = columnsErrors;
    fieldValidation.breakpointMinWidthByIndex[index] = minWidthErrors;
  });

  for (const duplicatedIndexes of minWidthLayoutsByValue.values()) {
    if (duplicatedIndexes.length <= 1) {
      continue;
    }

    duplicatedIndexes.forEach((index) => {
      fieldValidation.breakpointMinWidthByIndex[index] = [
        ...(fieldValidation.breakpointMinWidthByIndex[index] ?? []),
        "Min width values must be unique.",
      ];
    });
  }

  return fieldValidation;
}

function isIconsValidationError(error: string): boolean {
  return error.includes("`icons`") || error.startsWith("Unknown icon slug");
}

function isGapValidationError(error: string): boolean {
  return error.includes("`gap`");
}

function isLayoutValidationError(error: string): boolean {
  return (
    !isIconsValidationError(error) &&
    !isGapValidationError(error) &&
    ![
      "Each column layout must use 2 to 20 columns.",
      "Breakpoint rows must include columns and breakpoint px.",
      "Breakpoint px must be an integer from 1 to 3840.",
      "Breakpoint px values must be unique.",
    ].includes(error)
  );
}

function isIntegerInRange(value: string, min: number, max: number): boolean {
  const numberValue = Number(value);

  return (
    value.trim() === value &&
    Number.isInteger(numberValue) &&
    numberValue >= min &&
    numberValue <= max
  );
}

function hasErrors(
  errors: readonly string[] | undefined,
): errors is readonly string[] {
  return errors !== undefined && errors.length > 0;
}

type ColumnLayoutRowProps = {
  actionsLabel: string;
  badgeLabel: string;
  children: React.ReactNode;
  copyImageUrl: (source: GeneratedImageSource) => void;
  copyImageUrlStatusByKey: Record<string, "failed" | "idle" | "succeeded">;
  generatedImageSources: GeneratedImageSource[];
  hasGeneratedOutput: boolean;
  minWidthPx: string | number | null;
  onOpenPreview: () => void;
  onRemove?: () => void;
  title: string;
};

function ColumnLayoutRow({
  actionsLabel,
  badgeLabel,
  children,
  copyImageUrl,
  copyImageUrlStatusByKey,
  generatedImageSources,
  hasGeneratedOutput,
  minWidthPx,
  onOpenPreview,
  onRemove,
  title,
}: ColumnLayoutRowProps) {
  const normalizedMinWidthPx = normalizeMinWidthPx(minWidthPx);
  const layoutSources = generatedImageSources.filter(
    (source) => source.minWidthPx === normalizedMinWidthPx,
  );
  const lightSource = layoutSources.find((source) => source.theme === "light");
  const darkSource = layoutSources.find((source) => source.theme === "dark");
  const hasPreviewSource =
    lightSource !== undefined || darkSource !== undefined;

  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="grid gap-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-medium text-card-foreground">
                {title}
              </p>
              <span className="rounded border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                {badgeLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IconTooltipButton
              ariaLabel={`Preview ${actionsLabel} column layout`}
              disabled={!hasGeneratedOutput || !hasPreviewSource}
              onClick={onOpenPreview}
              tooltip="Preview column layout"
            >
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
            </IconTooltipButton>
            <ImageUrlCopyDropdown
              actionsLabel={actionsLabel}
              copyImageUrl={copyImageUrl}
              copyImageUrlStatusByKey={copyImageUrlStatusByKey}
              darkSource={darkSource}
              lightSource={lightSource}
            />
            {onRemove === undefined ? null : (
              <IconTooltipButton
                ariaLabel={`Remove ${actionsLabel} breakpoint`}
                onClick={onRemove}
                tooltip="Remove breakpoint"
              >
                <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              </IconTooltipButton>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

type ImageUrlCopyDropdownProps = {
  actionsLabel: string;
  copyImageUrl: (source: GeneratedImageSource) => void;
  copyImageUrlStatusByKey: Record<string, "failed" | "idle" | "succeeded">;
  darkSource: GeneratedImageSource | undefined;
  lightSource: GeneratedImageSource | undefined;
};

function ImageUrlCopyDropdown({
  actionsLabel,
  copyImageUrl,
  copyImageUrlStatusByKey,
  darkSource,
  lightSource,
}: ImageUrlCopyDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Copy ${actionsLabel} image URL`}
              className="w-auto gap-1 px-2.5"
              disabled={lightSource === undefined && darkSource === undefined}
              size="icon"
              type="button"
              variant="outline"
            >
              <CopyIcon className="h-4 w-4" aria-hidden="true" />
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Copy image URL</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <ImageUrlCopyMenuItem
          actionsLabel={actionsLabel}
          copyImageUrl={copyImageUrl}
          source={lightSource}
          status={
            lightSource === undefined
              ? "idle"
              : copyImageUrlStatusByKey[getGeneratedImageSourceKey(lightSource)]
          }
          theme="light"
        />
        <ImageUrlCopyMenuItem
          actionsLabel={actionsLabel}
          copyImageUrl={copyImageUrl}
          source={darkSource}
          status={
            darkSource === undefined
              ? "idle"
              : copyImageUrlStatusByKey[getGeneratedImageSourceKey(darkSource)]
          }
          theme="dark"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ImageUrlCopyMenuItemProps = {
  actionsLabel: string;
  copyImageUrl: (source: GeneratedImageSource) => void;
  source: GeneratedImageSource | undefined;
  status: "failed" | "idle" | "succeeded" | undefined;
  theme: "dark" | "light";
};

function ImageUrlCopyMenuItem({
  actionsLabel,
  copyImageUrl,
  source,
  status,
  theme,
}: ImageUrlCopyMenuItemProps) {
  const ThemeIcon = theme === "light" ? SunIcon : MoonIcon;

  return (
    <DropdownMenuItem
      aria-label={`Copy ${actionsLabel} ${theme} image URL`}
      className="font-mono text-xs"
      disabled={source === undefined}
      onSelect={(event) => {
        event.preventDefault();
        if (source !== undefined) {
          copyImageUrl(source);
        }
      }}
    >
      {status === "succeeded" ? (
        <CheckIcon className="h-4 w-4" aria-hidden="true" />
      ) : status === "failed" ? (
        <XIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
      ) : (
        <ThemeIcon className="h-4 w-4" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {status === "succeeded"
          ? "Copied"
          : status === "failed"
            ? "Copy failed"
            : `Copy ${theme} image URL`}
      </span>
    </DropdownMenuItem>
  );
}

type IconTooltipButtonProps = {
  ariaLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tooltip: string;
};

function IconTooltipButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
  tooltip,
}: IconTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onClick}
          size="icon"
          type="button"
          variant="outline"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type ColumnLayoutPreviewDialogProps = {
  generatedImageSources: GeneratedImageSource[];
  onOpenChange: (open: boolean) => void;
  previewTarget: PreviewTarget | null;
  previewTheme: StackIconsEditorState["previewTheme"];
  updatePreviewTheme: (
    previewTheme: StackIconsEditorState["previewTheme"],
  ) => void;
};

function ColumnLayoutPreviewDialog({
  generatedImageSources,
  onOpenChange,
  previewTarget,
  previewTheme,
  updatePreviewTheme,
}: ColumnLayoutPreviewDialogProps) {
  const normalizedMinWidthPx = normalizeMinWidthPx(
    previewTarget?.minWidthPx ?? null,
  );
  const previewSource = generatedImageSources.find(
    (source) =>
      source.minWidthPx === normalizedMinWidthPx &&
      source.theme === previewTheme,
  );

  return (
    <Dialog open={previewTarget !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            {previewTarget?.label ?? "Column layout"} preview
          </DialogTitle>
          <DialogDescription className="font-mono">
            Inspect one generated image source for this column layout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            Preview theme
          </p>
          <ToggleGroup
            aria-label="Preview theme"
            onValueChange={(theme) => {
              if (theme === "light" || theme === "dark") {
                updatePreviewTheme(theme);
              }
            }}
            type="single"
            value={previewTheme}
          >
            <ToggleGroupItem
              aria-label="Light"
              className="gap-2 font-mono"
              size="sm"
              value="light"
            >
              <SunIcon className="h-4 w-4" aria-hidden="true" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="Dark"
              className="gap-2 font-mono"
              size="sm"
              value="dark"
            >
              <MoonIcon className="h-4 w-4" aria-hidden="true" />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div
          data-testid="column-layout-preview-box"
          className={cn(
            "overflow-auto rounded-md border p-4",
            previewTheme === "dark"
              ? "border-slate-700 bg-[#0d1117]"
              : "bg-background",
          )}
        >
          {previewSource === undefined ? (
            <div
              className={cn(
                "rounded-md border px-3 py-10 text-center font-mono text-sm",
                previewTheme === "dark"
                  ? "border-slate-700 bg-slate-900 text-slate-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Fix validation errors to create generated sources.
            </div>
          ) : (
            <Image
              alt={`${previewTarget?.label ?? "Column layout"} ${previewTheme} column layout preview`}
              className="h-auto w-auto max-w-none"
              height={160}
              src={previewSource.url}
              unoptimized
              width={640}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
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
