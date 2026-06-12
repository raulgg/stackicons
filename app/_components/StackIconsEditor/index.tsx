"use client";

import React from "react";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  getEditableBaseColumnLayout,
  getEditableBreakpointColumnLayouts,
} from "@/lib/icons/column-layout";
import { formatUnknownSlugsMessage } from "@/lib/icons/parse-request";
import { getIconLabel } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";
import { ColumnLayoutPreview } from "./ColumnLayoutPreview";
import { DownloadImagesPopover } from "./DownloadImagesPopover";
import { EditorSection, type EditorSectionKey } from "./EditorSection";
import { parseIconSlugs, StackIconPicker } from "./IconPicker";
import { ReadmeImageCodePanel } from "./ReadmeImageCodePanel";
import { SelectedIconTiles } from "./SelectedIconTiles";
import {
  ICON_SIZE_STEP,
  MAX_ICON_SIZE,
  MIN_ICON_SIZE,
  type StackIconsEditorState,
} from "./state";
import { useStackIconsEditorForm } from "./useStackIconsEditorForm";

export type { StackIconsEditorState } from "./state";

type StackIconsEditorProps = {
  initialState: StackIconsEditorState;
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
    copyReadmeImageCode,
    generatedHtml,
    generatedImageSources,
    hasGeneratedOutput,
    removeBreakpointLayout,
    state,
    switchLayoutMode,
    unknownSlugs,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  } = useStackIconsEditorForm(initialState);
  const [isPlainTextSlugEditorOpen, setIsPlainTextSlugEditorOpen] =
    React.useState(false);
  const pickerSearchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [openSections, setOpenSections] = React.useState<
    Record<EditorSectionKey, boolean>
  >({
    icons: true,
    layout: true,
    spacing: true,
  });

  function toggleSection(sectionKey: EditorSectionKey) {
    setOpenSections((open) => ({ ...open, [sectionKey]: !open[sectionKey] }));
  }

  const selectedIconSlugs = parseIconSlugs(state.icons);

  function toggleIconSlug(slug: string) {
    const nextSlugs = selectedIconSlugs.includes(slug)
      ? selectedIconSlugs.filter((selectedSlug) => selectedSlug !== slug)
      : [...selectedIconSlugs, slug];

    updateField("icons", nextSlugs.join(","));
  }

  function removeIconSlugAt(slugIndex: number) {
    updateField(
      "icons",
      selectedIconSlugs.filter((_slug, index) => index !== slugIndex).join(","),
    );
  }

  function reorderIconSlug(fromIndex: number, toIndex: number) {
    const nextSlugs = [...selectedIconSlugs];
    const [movedSlug] = nextSlugs.splice(fromIndex, 1);

    nextSlugs.splice(toIndex, 0, movedSlug);
    updateField("icons", nextSlugs.join(","));
  }

  function focusIconPickerSearch() {
    pickerSearchInputRef.current?.focus();
  }

  const baseColumnLayout = getEditableBaseColumnLayout(state.columnLayouts);
  const breakpointLayouts = getEditableBreakpointColumnLayouts(
    state.columnLayouts,
  );
  const fieldValidation = getStackIconsEditorFieldValidation({
    state,
    unknownSlugs,
    validationErrors,
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <EditorSection
        isDone={selectedIconSlugs.length > 0}
        isOpen={openSections.icons}
        onToggle={() => toggleSection("icons")}
        sectionKey="icons"
        stepNumber={1}
        summary={getIconsSummary(selectedIconSlugs)}
        title="Icons"
      >
        <Field data-invalid={hasErrors(fieldValidation.icons) || undefined}>
          <p className="font-mono text-sm font-medium text-card-foreground">
            Icons
          </p>
          <FieldDescription className="font-mono">
            Tile order is the icon order in the generated image. Drag tiles to
            reorder.
          </FieldDescription>
          <SelectedIconTiles
            onAddIconRequest={focusIconPickerSearch}
            onRemoveSlug={removeIconSlugAt}
            onReorderSlug={reorderIconSlug}
            slugs={selectedIconSlugs}
          />
          <StackIconPicker
            describedBy={
              hasErrors(fieldValidation.icons) ? "icons-error" : undefined
            }
            onToggleSlug={toggleIconSlug}
            searchInputRef={pickerSearchInputRef}
            selectedSlugs={selectedIconSlugs}
          />
          <div>
            <button
              aria-controls="icons-plain-text-editor"
              aria-expanded={isPlainTextSlugEditorOpen}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-ink"
              onClick={() =>
                setIsPlainTextSlugEditorOpen((isEditorOpen) => !isEditorOpen)
              }
              type="button"
            >
              <ChevronDownIcon
                aria-hidden="true"
                className={cn(
                  "h-[13px] w-[13px]",
                  isPlainTextSlugEditorOpen && "rotate-180",
                )}
              />
              {isPlainTextSlugEditorOpen
                ? "Hide slugs as text"
                : "Edit slugs as text"}
            </button>
            {isPlainTextSlugEditorOpen ? (
              <div id="icons-plain-text-editor">
                <FieldLabel className="sr-only" htmlFor="icons">
                  Icon slugs
                </FieldLabel>
                <Textarea
                  className="mt-2 min-h-[72px] w-full resize-none rounded-[6px] bg-surface-2 font-mono text-[13px]"
                  aria-describedby={
                    hasErrors(fieldValidation.icons) ? "icons-error" : undefined
                  }
                  aria-invalid={hasErrors(fieldValidation.icons) || undefined}
                  id="icons"
                  onChange={(event) => updateField("icons", event.target.value)}
                  value={state.icons}
                />
              </div>
            ) : null}
          </div>
          <FieldError errors={fieldValidation.icons} id="icons-error" />
        </Field>
      </EditorSection>

      <EditorSection
        isDone
        isOpen={openSections.layout}
        onToggle={() => toggleSection("layout")}
        sectionKey="layout"
        stepNumber={2}
        summary={getLayoutSummary(state)}
        title="Layout"
      >
        <div className="grid gap-5">
          <fieldset>
            <legend className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2">
              Layout mode
            </legend>
            <div className="mt-2 inline-flex gap-[3px] rounded-[6px] border bg-surface-3 p-[3px]">
              <LayoutModeSegmentedButton
                ariaLabel="Single layout"
                isActive={state.layoutMode === "single"}
                onSelect={() => switchLayoutMode("single")}
              >
                Single
              </LayoutModeSegmentedButton>
              <LayoutModeSegmentedButton
                ariaLabel="Responsive layout"
                isActive={state.layoutMode === "responsive"}
                onSelect={() => switchLayoutMode("responsive")}
              >
                Responsive
              </LayoutModeSegmentedButton>
            </div>
          </fieldset>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2">
              Column layouts
            </p>
            <FieldError
              errors={fieldValidation.layout}
              id="column-layouts-error"
            />
            <div className="mt-2 grid gap-[9px]">
              <div className="flex flex-wrap items-center gap-3 rounded-[6px] border bg-surface-2 px-[13px] py-[11px]">
                <span className="text-[13px] font-bold">Base</span>
                <span className="rounded-[6px] bg-accent-soft px-2 py-[3px] font-mono text-[10.5px] uppercase text-accent-ink">
                  All widths
                </span>
                <label className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-ink-2">
                    columns
                  </span>
                  <ColumnLayoutMiniInput
                    describedBy="base-columns-error"
                    errors={fieldValidation.baseColumns}
                    max={20}
                    min={2}
                    onChange={updateBaseColumns}
                    value={baseColumnLayout?.columns ?? ""}
                  />
                </label>
                <ColumnLayoutRowError
                  errors={fieldValidation.baseColumns}
                  id="base-columns-error"
                />
              </div>

              {state.layoutMode === "responsive"
                ? breakpointLayouts.map(({ layout, originalIndex }) => {
                    const isRemovable = breakpointLayouts.length > 1;
                    const breakpointLabel =
                      layout.minWidthPx === ""
                        ? "breakpoint"
                        : `${layout.minWidthPx}px`;
                    const columnsErrors =
                      fieldValidation.breakpointColumnsByIndex[originalIndex] ??
                      [];
                    const minWidthErrors =
                      fieldValidation.breakpointMinWidthByIndex[
                        originalIndex
                      ] ?? [];

                    return (
                      <div
                        className="flex flex-wrap items-center gap-3 rounded-[6px] border px-[13px] py-[11px]"
                        key={originalIndex}
                      >
                        <span
                          aria-hidden="true"
                          className="font-mono text-[13px] text-ink-2"
                        >
                          ≥
                        </span>
                        <ColumnLayoutMiniInput
                          ariaLabel="Min width"
                          describedBy={`breakpoint-min-width-error-${originalIndex}`}
                          errors={minWidthErrors}
                          max={3840}
                          min={1}
                          onChange={(minWidthPx) =>
                            updateColumnLayout(
                              originalIndex,
                              "minWidthPx",
                              minWidthPx,
                            )
                          }
                          value={layout.minWidthPx}
                          widthClassName="w-[84px]"
                        />
                        <span
                          aria-hidden="true"
                          className="font-mono text-[13px] text-ink-2"
                        >
                          px
                        </span>
                        <label className="flex items-center gap-2">
                          <span className="font-mono text-[13px] text-ink-2">
                            columns
                          </span>
                          <ColumnLayoutMiniInput
                            describedBy={`breakpoint-columns-error-${originalIndex}`}
                            errors={columnsErrors}
                            max={20}
                            min={2}
                            onChange={(columns) =>
                              updateColumnLayout(
                                originalIndex,
                                "columns",
                                columns,
                              )
                            }
                            value={layout.columns}
                          />
                        </label>
                        <ColumnLayoutRowError
                          errors={columnsErrors}
                          id={`breakpoint-columns-error-${originalIndex}`}
                        />
                        <ColumnLayoutRowError
                          errors={minWidthErrors}
                          id={`breakpoint-min-width-error-${originalIndex}`}
                        />
                        {isRemovable ? (
                          <button
                            aria-label={`Remove ${breakpointLabel} breakpoint`}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-[6px] text-ink-2 hover:bg-destructive hover:text-white"
                            onClick={() =>
                              removeBreakpointLayout(originalIndex)
                            }
                            type="button"
                          >
                            <Trash2Icon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>

            {state.layoutMode === "responsive" ? (
              <Button
                className="mt-3"
                onClick={addBreakpointLayout}
                size="sm"
                type="button"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Add breakpoint
              </Button>
            ) : null}
          </div>
        </div>
      </EditorSection>

      <EditorSection
        isDone
        isOpen={openSections.spacing}
        onToggle={() => toggleSection("spacing")}
        sectionKey="spacing"
        stepNumber={3}
        summary={`${state.iconSize}px · gap ${state.gap}px`}
        title="Spacing & size"
      >
        <div>
          <SpacingSliderRow
            label="Icon size"
            max={MAX_ICON_SIZE}
            min={MIN_ICON_SIZE}
            onChange={(iconSize) => updateField("iconSize", iconSize)}
            step={ICON_SIZE_STEP}
            value={state.iconSize}
          />
          <div aria-hidden="true" className="my-[18px] border-t" />
          <SpacingSliderRow
            describedBy={
              hasErrors(fieldValidation.gap) ? "gap-error" : undefined
            }
            label="Gap between icons"
            max={24}
            min={0}
            onChange={(gap) => updateField("gap", gap)}
            step={1}
            value={state.gap}
          />
          <FieldError errors={fieldValidation.gap} id="gap-error" />
        </div>
      </EditorSection>

      <ColumnLayoutPreview
        codePanel={
          <ReadmeImageCodePanel
            hasSelectedIcons={selectedIconSlugs.length > 0}
            onCopy={copyReadmeImageCode}
            readmeImageCode={generatedHtml}
          />
        }
        columnLayouts={state.columnLayouts}
        downloadAction={
          <DownloadImagesPopover
            generatedImageSources={generatedImageSources}
            isDisabled={selectedIconSlugs.length === 0 || !hasGeneratedOutput}
          />
        }
        gap={state.gap}
        iconSize={state.iconSize}
        layoutMode={state.layoutMode}
        onPreviewThemeChange={(previewTheme) =>
          updateField("previewTheme", previewTheme)
        }
        previewTheme={state.previewTheme}
        slugs={selectedIconSlugs}
      />
    </div>
  );
}

const ICONS_SUMMARY_LABEL_LIMIT = 4;

function getIconsSummary(slugs: readonly string[]): string {
  if (slugs.length === 0) {
    return "none yet";
  }

  const labels = slugs.map((slug) => getIconLabel(slug) ?? slug);
  const shownLabels = labels.slice(0, ICONS_SUMMARY_LABEL_LIMIT).join(", ");
  const overflowCount = labels.length - ICONS_SUMMARY_LABEL_LIMIT;

  return overflowCount > 0 ? `${shownLabels} +${overflowCount}` : shownLabels;
}

function getLayoutSummary(state: StackIconsEditorState): string {
  if (state.layoutMode === "responsive") {
    return `responsive · ${state.columnLayouts.length} layouts`;
  }

  const baseColumnLayout = getEditableBaseColumnLayout(state.columnLayouts);

  return `single · ${baseColumnLayout?.columns ?? "?"} cols`;
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

const COLUMNS_RANGE_ERROR = "2–20 columns";
const MIN_WIDTH_RANGE_ERROR = "1–3840px";
const DUPLICATE_MIN_WIDTH_ERROR = "duplicate min-width";

function getStackIconsEditorFieldValidation({
  state,
  unknownSlugs,
  validationErrors,
}: {
  state: StackIconsEditorState;
  unknownSlugs: readonly string[];
  validationErrors: readonly string[];
}): StackIconsEditorFieldValidation {
  const fieldValidation: StackIconsEditorFieldValidation = {
    baseColumns: [],
    breakpointColumnsByIndex: {},
    breakpointMinWidthByIndex: {},
    gap: validationErrors.filter(isGapValidationError),
    icons: [
      ...validationErrors.filter(isIconsValidationError),
      ...(unknownSlugs.length > 0
        ? [formatUnknownSlugsMessage(unknownSlugs)]
        : []),
    ],
    layout: validationErrors.filter(isLayoutValidationError),
  };
  const minWidthLayoutsByValue = new Map<string, number[]>();

  state.columnLayouts.forEach((layout, index) => {
    if (layout.minWidthPx === null) {
      if (!isIntegerInRange(layout.columns, 2, 20)) {
        fieldValidation.baseColumns.push(COLUMNS_RANGE_ERROR);
      }
      return;
    }

    const columnsErrors: string[] = [];
    const minWidthErrors: string[] = [];
    const hasColumns = layout.columns !== "";
    const hasMinWidth = layout.minWidthPx !== "";

    if (
      (hasColumns || hasMinWidth) &&
      !isIntegerInRange(layout.columns, 2, 20)
    ) {
      columnsErrors.push(COLUMNS_RANGE_ERROR);
    }

    if (
      (hasColumns || hasMinWidth) &&
      !isIntegerInRange(layout.minWidthPx, 1, 3840)
    ) {
      minWidthErrors.push(MIN_WIDTH_RANGE_ERROR);
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
        DUPLICATE_MIN_WIDTH_ERROR,
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

type SpacingSliderRowProps = {
  describedBy?: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  step: number;
  value: string;
};

// One Spacing & size row: mono uppercase label above, slider with a live
// value readout right-aligned next to it.
function SpacingSliderRow({
  describedBy,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: SpacingSliderRowProps) {
  const numericValue = Number(value);
  const sliderValue = Number.isFinite(numericValue) ? numericValue : min;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Slider
          aria-describedby={describedBy}
          aria-label={label}
          className="flex-1"
          max={max}
          min={min}
          onValueChange={([nextValue]) => onChange(String(nextValue))}
          step={step}
          value={[sliderValue]}
        />
        <span className="min-w-[54px] text-right font-mono text-[15px] font-semibold">
          {value}px
        </span>
      </div>
    </div>
  );
}

type LayoutModeSegmentedButtonProps = {
  ariaLabel: string;
  children: React.ReactNode;
  isActive: boolean;
  onSelect: () => void;
};

// Accent variant of the segmented control: the active segment fills with the
// accent color (the theme toggle uses the neutral variant). Accent-driven
// backgrounds never transition; only color and transform may.
function LayoutModeSegmentedButton({
  ariaLabel,
  children,
  isActive,
  onSelect,
}: LayoutModeSegmentedButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={cn(
        "rounded-[7px] px-[13px] py-[7px] text-[13px] font-semibold transition-[color,transform]",
        isActive ? "bg-accent text-white" : "text-ink-2 hover:text-ink",
      )}
      onClick={onSelect}
      type="button"
    >
      {children}
    </button>
  );
}

type ColumnLayoutMiniInputProps = {
  ariaLabel?: string;
  describedBy: string;
  errors: readonly string[];
  max: number;
  min: number;
  onChange: (value: string) => void;
  value: string;
  widthClassName?: string;
};

function ColumnLayoutMiniInput({
  ariaLabel,
  describedBy,
  errors,
  max,
  min,
  onChange,
  value,
  widthClassName = "w-[72px]",
}: ColumnLayoutMiniInputProps) {
  const isInvalid = hasErrors(errors);

  return (
    <input
      aria-describedby={isInvalid ? describedBy : undefined}
      aria-invalid={isInvalid || undefined}
      aria-label={ariaLabel}
      className={cn(
        "rounded-[6px] border border-border-strong bg-background px-2.5 py-2 font-mono text-[13px] text-foreground",
        widthClassName,
        isInvalid && "border-destructive ring-[3px] ring-destructive-soft",
      )}
      max={max}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      type="number"
      value={value}
    />
  );
}

type ColumnLayoutRowErrorProps = {
  errors: readonly string[];
  id: string;
};

function ColumnLayoutRowError({ errors, id }: ColumnLayoutRowErrorProps) {
  if (!hasErrors(errors)) {
    return null;
  }

  return (
    <span
      aria-live="polite"
      className="font-mono text-[12.5px] text-destructive"
      id={id}
    >
      {errors.join(" ")}
    </span>
  );
}
