"use client";

import React from "react";
import { BookOpenIcon, MoonIcon, SunIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  getColumnLayoutPreviewBands,
  getEditableBaseColumnLayout,
  resolveColumnLayoutPreviewBaseColumns,
  type ColumnLayoutPreviewBand,
  type EditableColumnLayout,
  type LayoutMode,
} from "@/lib/icons/column-layout";
import { getIconGridLayout } from "@/lib/icons/layout";
import { isIconSlug } from "@/lib/icons/registry";
import type { StackIconsPreviewTheme } from "./state";

// Fixed image-theme stage colors. These deliberately ignore the UI chrome
// theme: the stage recreates what the generated image source looks like on a
// light or dark GitHub README background (Primer canvas-default plus the
// dark border-default).
const STAGE_COLORS: Record<
  StackIconsPreviewTheme,
  { backgroundColor: string; borderColor?: string }
> = {
  light: { backgroundColor: "#ffffff" },
  dark: { backgroundColor: "#0d1117", borderColor: "#30363d" },
};

const FALLBACK_GAP = 8;
const FALLBACK_ICON_SIZE = 48;

// Human-readable viewport range for one band given the full sorted band list:
// the band runs from its own min-width up to just below the next band's
// min-width, and the widest band is open-ended.
export function getColumnLayoutPreviewBandRangeText(
  bandIndex: number,
  bands: readonly ColumnLayoutPreviewBand[],
): string {
  if (bands.length === 1) {
    return "any width";
  }

  const band = bands[bandIndex];
  const nextBand = bands[bandIndex + 1];

  if (band.minWidthPx === null) {
    return nextBand === undefined
      ? "any width"
      : `under ${nextBand.minWidthPx}px`;
  }

  if (nextBand === undefined) {
    return `${band.minWidthPx}px and up`;
  }

  return `${band.minWidthPx}–${(nextBand.minWidthPx ?? 1) - 1}px`;
}

// The stage's column count is derived through the shared server grid math
// rather than re-implemented: it is the number of distinct cell x positions
// getIconGridLayout places for the same inputs.
export function getColumnLayoutPreviewColumnCount({
  columns,
  gap,
  iconCount,
  iconSize,
}: {
  columns: number;
  gap: number;
  iconCount: number;
  iconSize: number;
}): number {
  if (iconCount === 0) {
    return 0;
  }

  const { placements } = getIconGridLayout({
    columns,
    gap,
    iconCount,
    iconSize,
  });

  return new Set(placements.map((placement) => placement.x)).size;
}

function getPreviewIconUrl({
  iconSize,
  previewTheme,
  slug,
}: {
  iconSize: number;
  previewTheme: StackIconsPreviewTheme;
  slug: string;
}): string {
  return `/icons?icons=${encodeURIComponent(slug)}&theme=${previewTheme}&size=${iconSize}`;
}

type ColumnLayoutPreviewProps = {
  codePanel?: React.ReactNode;
  downloadAction?: React.ReactNode;
  columnLayouts: readonly EditableColumnLayout[];
  gap: string;
  iconSize: string;
  layoutMode: LayoutMode;
  onPreviewThemeChange: (previewTheme: StackIconsPreviewTheme) => void;
  previewTheme: StackIconsPreviewTheme;
  slugs: readonly string[];
};

// Always-visible column layout preview: a live client-side recreation of one
// column layout's generated image source for the selected preview theme,
// wrapped in a code-block-style box. The box's header strip carries the
// column-layout tabs on the left (a Base tab plus one tab per breakpoint band
// in responsive mode) and the Light/Dark image-theme switch on the right; the
// box body is the themed stage. Unknown slugs are skipped entirely, matching
// how generated image sources render (ADR 0002).
export function ColumnLayoutPreview({
  codePanel,
  columnLayouts,
  downloadAction,
  gap,
  iconSize,
  layoutMode,
  onPreviewThemeChange,
  previewTheme,
  slugs,
}: ColumnLayoutPreviewProps) {
  // Band selection is ephemeral UI state, never part of the shareable URL.
  // Clamping happens on read (not in an effect): when layout edits remove the
  // selected band, the stage derives back to the base band atomically.
  const [selectedBandIndex, setSelectedBandIndex] = React.useState(0);
  const renderableSlugs = slugs.filter(isIconSlug);
  const allBands = getColumnLayoutPreviewBands(columnLayouts);
  // The stage always has a band to recreate: in single mode (or responsive
  // with no usable breakpoints) it is a lone Base band derived from the base
  // column layout; otherwise it is the full sorted band list (Base first).
  const isResponsivePreview =
    layoutMode === "responsive" && allBands.length >= 2;
  const baseColumns = resolveColumnLayoutPreviewBaseColumns(
    getEditableBaseColumnLayout(columnLayouts).columns,
  );
  const bands: ColumnLayoutPreviewBand[] = isResponsivePreview
    ? allBands
    : [{ columns: baseColumns, minWidthPx: null }];
  const activeBandIndex =
    selectedBandIndex < bands.length ? selectedBandIndex : 0;
  const gapPx =
    Number.isFinite(Number(gap)) && gap.trim() !== ""
      ? Number(gap)
      : FALLBACK_GAP;
  const iconSizePx =
    Number.isFinite(Number(iconSize)) && iconSize.trim() !== ""
      ? Number(iconSize)
      : FALLBACK_ICON_SIZE;

  return (
    <section
      aria-label="Column layout preview"
      className="rounded-[6px] border bg-card text-card-foreground"
    >
      {/* GitHub README-style card header: the label renders as the selected
          tab of an underline nav. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-b pl-5 pr-3">
        <span className="relative flex items-center gap-2 py-[13px] text-sm font-semibold">
          <BookOpenIcon aria-hidden="true" className="h-4 w-4 text-ink-2" />
          README
          <span
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent"
          />
        </span>
        {downloadAction}
      </div>
      <div className="mx-5 mb-[2px] mt-[18px]">
        {/* The preview box: a code-block-style bordered surface whose muted
            header strip holds the column-layout tabs and the image-theme
            switch, and whose body is the themed stage. */}
        <Tabs
          className="overflow-hidden rounded-[6px] border"
          onValueChange={(value) => setSelectedBandIndex(Number(value))}
          value={String(activeBandIndex)}
        >
          <div className="flex items-center justify-between gap-x-3 border-b bg-surface-2 px-3 py-[6px]">
            <TabsList aria-label="Preview column layout" variant="segmented">
              {bands.map((band, bandIndex) => (
                <TabsTrigger
                  key={`${band.minWidthPx ?? "base"}-${bandIndex}`}
                  value={String(bandIndex)}
                >
                  {bandIndex === 0
                    ? `Base · ${band.columns}`
                    : `${band.columns} cols`}
                </TabsTrigger>
              ))}
            </TabsList>
            <ToggleGroup
              aria-label="Preview theme"
              onValueChange={(value) => {
                // A theme is always selected: ignore the empty-string deselect
                // Radix emits when the active item is pressed again.
                if (value === "light" || value === "dark") {
                  onPreviewThemeChange(value);
                }
              }}
              size="iconSm"
              type="single"
              value={previewTheme}
            >
              <ToggleGroupItem aria-label="Light" value="light">
                <SunIcon aria-hidden="true" size={15} />
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Dark" value="dark">
                <MoonIcon aria-hidden="true" size={15} />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {bands.map((band, bandIndex) => (
            <TabsContent
              key={`${band.minWidthPx ?? "base"}-${bandIndex}`}
              value={String(bandIndex)}
            >
              <PreviewStage
                columns={band.columns}
                gapPx={gapPx}
                iconSizePx={iconSizePx}
                previewTheme={previewTheme}
                slugs={renderableSlugs}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <p className="px-5 pb-[18px] pt-[10px] text-center font-mono text-[11.5px] text-ink-3">
        {`${getColumnLayoutPreviewBandRangeText(activeBandIndex, bands)} · ${iconSizePx}px icons · gap ${gapPx}px`}
      </p>
      {codePanel}
    </section>
  );
}

type PreviewStageProps = {
  columns: number;
  gapPx: number;
  iconSizePx: number;
  previewTheme: StackIconsPreviewTheme;
  slugs: readonly string[];
};

// The themed stage body for one band: the icon grid (or empty state) rendered
// at the band's column count. The rendered column count still comes from the
// shared server grid math via getColumnLayoutPreviewColumnCount, preserving
// the icon-count/gap/size derivation. The fixed image-theme background lives
// here so each tabpanel recreates its band's generated image source.
function PreviewStage({
  columns,
  gapPx,
  iconSizePx,
  previewTheme,
  slugs,
}: PreviewStageProps) {
  const stageColumnCount = getColumnLayoutPreviewColumnCount({
    columns,
    gap: gapPx,
    iconCount: slugs.length,
    iconSize: iconSizePx,
  });

  return (
    <div
      className="flex max-w-full items-center justify-center overflow-x-auto px-4 py-[22px] sm:px-[26px] sm:py-[30px]"
      data-preview-theme={previewTheme}
      style={STAGE_COLORS[previewTheme]}
    >
      {slugs.length === 0 ? (
        <p className="text-center text-[14px] text-ink-3">
          Add icons above to see your stack rendered here.
        </p>
      ) : (
        <ul
          aria-label="Column layout preview icons"
          className="grid"
          style={{
            gap: `${gapPx + 4}px`,
            gridTemplateColumns: `repeat(${stageColumnCount}, ${iconSizePx}px)`,
          }}
        >
          {slugs.map((slug, index) => (
            <ColumnLayoutPreviewIconCell
              iconSize={iconSizePx}
              key={`${slug}-${index}-${previewTheme}-${iconSizePx}`}
              previewTheme={previewTheme}
              slug={slug}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type ColumnLayoutPreviewIconCellProps = {
  iconSize: number;
  previewTheme: StackIconsPreviewTheme;
  slug: string;
};

// One stage cell. Known slugs whose thumbnail request fails degrade to the
// same monogram treatment as SelectedIconTiles instead of a broken image.
function ColumnLayoutPreviewIconCell({
  iconSize,
  previewTheme,
  slug,
}: ColumnLayoutPreviewIconCellProps) {
  const [hasThumbnailError, setHasThumbnailError] = React.useState(false);

  return (
    <li className="flex items-center justify-center">
      {hasThumbnailError ? (
        <span
          aria-hidden="true"
          className="flex items-center justify-center rounded-[9px] bg-surface-3 font-mono text-sm font-semibold text-ink-2"
          style={{ height: iconSize, width: iconSize }}
        >
          {slug.slice(0, 2)}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          alt={slug}
          height={iconSize}
          onError={() => setHasThumbnailError(true)}
          src={getPreviewIconUrl({ iconSize, previewTheme, slug })}
          style={{ height: iconSize, width: iconSize }}
          width={iconSize}
        />
      )}
    </li>
  );
}
