"use client";

import React from "react";
import {
  BlocksIcon,
  ChevronDownIcon,
  Columns3Icon,
  PlusIcon,
  RulerIcon,
  Trash2Icon,
} from "lucide-react";
import {
  IconsImageCodePanel,
  useResolvedPreviewTheme,
  type StackIconsPreviewTheme,
} from "@/app/_components/readme";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  getEditableBaseColumnLayout,
  getEditableBreakpointColumnLayouts,
  type ColumnLayoutRichResult,
} from "@/lib/icons/column-layout";
import { formatUnknownSlugsMessage } from "@/lib/icons/parse-request";
import { getIconLabel } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";
import { ColumnLayoutPreview } from "./ColumnLayoutPreview";
import { DownloadImagesPopover } from "./DownloadImagesPopover";
import { EditorSection, type EditorSectionKey } from "./EditorSection";
import { parseIconSlugs } from "@/lib/icons/icon-slugs";
import { StackIconPicker } from "./IconPicker";
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
    columnLayoutResult,
    copyIconsImageCode,
    generatedHtml,
    generatedImageSources,
    hasGeneratedOutput,
    iconsImageCodeEmptyPlaceholder,
    removeBreakpointLayout,
    state,
    unknownSlugs,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  } = useStackIconsEditorForm(initialState);
  const [isPlainTextSlugEditorOpen, setIsPlainTextSlugEditorOpen] =
    React.useState(false);
  const resolvedUiTheme = useResolvedPreviewTheme();
  const [previewTheme, setPreviewTheme] =
    React.useState<StackIconsPreviewTheme>(resolvedUiTheme);
  const [lastSeededUiTheme, setLastSeededUiTheme] =
    React.useState(resolvedUiTheme);

  // The preview theme is ephemeral: every UI theme change re-seeds it to the
  // resolved UI theme, and the user can then switch it freely until the next
  // UI theme change (ADR 0004). Adjusted during render instead of in an
  // effect so the seeded value paints in the same pass.
  if (lastSeededUiTheme !== resolvedUiTheme) {
    setLastSeededUiTheme(resolvedUiTheme);
    setPreviewTheme(resolvedUiTheme);
  }
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
    unknownSlugs,
    validationErrors,
    columnLayoutResult,
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <EditorSection
        icon={<BlocksIcon className="h-4 w-4" />}
        isOpen={openSections.icons}
        onToggle={() => toggleSection("icons")}
        sectionKey="icons"
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
          <StackIconPicker
            describedBy={
              hasErrors(fieldValidation.icons) ? "icons-error" : undefined
            }
            onSelectedSlugsChange={(nextIconSlugs) =>
              updateField("icons", nextIconSlugs.join(","))
            }
            searchInputRef={pickerSearchInputRef}
            selectedSlugs={selectedIconSlugs}
          />
          <SelectedIconTiles
            hasIconsFieldError={
              selectedIconSlugs.length === 0 && hasErrors(fieldValidation.icons)
            }
            onAddIconRequest={focusIconPickerSearch}
            onRemoveSlug={removeIconSlugAt}
            onReorderSlug={reorderIconSlug}
            slugs={selectedIconSlugs}
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
        icon={<Columns3Icon className="h-4 w-4" />}
        isOpen={openSections.layout}
        onToggle={() => toggleSection("layout")}
        sectionKey="layout"
        summary={getLayoutSummary(state)}
        title="Layout"
      >
        <div className="mt-4">
          <FieldError
            errors={fieldValidation.layout}
            id="column-layouts-error"
          />
          <div className="grid gap-[9px]">
            <BaseColumnLayoutRow
              columns={baseColumnLayout?.columns ?? ""}
              errors={fieldValidation.baseColumns}
              onChange={updateBaseColumns}
            />

            {breakpointLayouts.map(({ layout, originalIndex }) => {
              const isRemovable = breakpointLayouts.length > 0;
              const breakpointLabel =
                layout.minWidthPx === ""
                  ? "breakpoint"
                  : `${layout.minWidthPx}px`;
              const columnsErrors =
                fieldValidation.breakpointColumnsByIndex[originalIndex] ?? [];
              const minWidthErrors =
                fieldValidation.breakpointMinWidthByIndex[originalIndex] ?? [];

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
                        updateColumnLayout(originalIndex, "columns", columns)
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
                    <Button
                      aria-label={`Remove ${breakpointLabel} breakpoint`}
                      className="ml-auto rounded-[6px]"
                      onClick={() => removeBreakpointLayout(originalIndex)}
                      size="iconSm"
                      type="button"
                      variant="destructiveGhost"
                    >
                      <Trash2Icon className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>

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
        </div>
      </EditorSection>

      <EditorSection
        icon={<RulerIcon className="h-4 w-4" />}
        isOpen={openSections.spacing}
        onToggle={() => toggleSection("spacing")}
        sectionKey="spacing"
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
          <IconsImageCodePanel
            emptyPlaceholder={iconsImageCodeEmptyPlaceholder}
            onCopy={copyIconsImageCode}
            iconsImageCode={generatedHtml}
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
        onPreviewThemeChange={setPreviewTheme}
        previewTheme={previewTheme}
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
  const bpCount = getEditableBreakpointColumnLayouts(
    state.columnLayouts,
  ).length;
  const base = getEditableBaseColumnLayout(state.columnLayouts);
  const cols = base?.columns ?? "?";

  if (bpCount === 0) {
    return `${cols} cols`;
  }

  const label = bpCount === 1 ? "breakpoint" : "breakpoints";
  return `${cols} cols · ${bpCount} ${label}`;
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
  unknownSlugs,
  validationErrors,
  columnLayoutResult,
}: {
  unknownSlugs: readonly string[];
  validationErrors: readonly string[];
  columnLayoutResult?: ColumnLayoutRichResult;
}): StackIconsEditorFieldValidation {
  const fieldValidation: StackIconsEditorFieldValidation = {
    baseColumns: [],
    breakpointColumnsByIndex: {},
    breakpointMinWidthByIndex: {},
    gap: validationErrors.filter(isGapValidationError),
    icons: [
      ...validationErrors
        .filter(isIconsValidationError)
        .map((e) =>
          e === "`s` is required." ||
          e === "`s` must include at least one icon slug."
            ? "Add at least one icon."
            : e,
        ),
      ...(unknownSlugs.length > 0
        ? [formatUnknownSlugsMessage(unknownSlugs)]
        : []),
    ],
    layout: validationErrors.filter(isLayoutValidationError),
  };

  if (columnLayoutResult) {
    fieldValidation.baseColumns = columnLayoutResult.baseColumns;
    fieldValidation.breakpointColumnsByIndex =
      columnLayoutResult.breakpointColumnsByIndex;
    fieldValidation.breakpointMinWidthByIndex =
      columnLayoutResult.breakpointMinWidthByIndex;
  }

  return fieldValidation;
}

function isIconsValidationError(error: string): boolean {
  return error.includes("`s`") || error.startsWith("Unknown icon slug");
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

type BaseColumnLayoutRowProps = {
  columns: string;
  errors: readonly string[];
  onChange: (columns: string) => void;
};

function BaseColumnLayoutRow({
  columns,
  errors,
  onChange,
}: BaseColumnLayoutRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[6px] border bg-surface-2 px-[13px] py-[11px]">
      <span className="text-[13px] font-bold">Base</span>
      <label className="flex items-center gap-2">
        <span className="font-mono text-[13px] text-ink-2">columns</span>
        <ColumnLayoutMiniInput
          describedBy="base-columns-error"
          errors={errors}
          max={20}
          min={2}
          onChange={onChange}
          value={columns}
        />
      </label>
      <ColumnLayoutRowError errors={errors} id="base-columns-error" />
    </div>
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
    <Input
      aria-describedby={isInvalid ? describedBy : undefined}
      aria-invalid={isInvalid || undefined}
      aria-label={ariaLabel}
      className={cn(
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
