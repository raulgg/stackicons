"use client";

import React from "react";
import { EyeIcon, MoonIcon, SunIcon } from "lucide-react";

import { getIconGridLayout } from "@/lib/icons/layout";
import { isIconSlug } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";
import type { StackIconsPreviewTheme } from "./state";

// Fixed image-theme stage colors. These deliberately ignore the UI chrome
// theme: the stage recreates what the generated image source looks like on a
// light or dark GitHub README background.
const STAGE_COLORS: Record<
  StackIconsPreviewTheme,
  { backgroundColor: string; borderColor?: string }
> = {
  light: { backgroundColor: "#FCFBF8" },
  dark: { backgroundColor: "#16181B", borderColor: "#2A2D31" },
};

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 20;
const FALLBACK_COLUMNS = 4;
const FALLBACK_GAP = 8;
const FALLBACK_ICON_SIZE = 48;

// Invalid/unparseable base columns fall back gracefully instead of blanking
// the stage: numeric values clamp into the valid 2–20 range and anything
// unparseable renders with the default 4 base columns. Generation itself
// still uses values as-is and surfaces validation errors elsewhere.
export function resolveColumnLayoutPreviewBaseColumns(
  baseColumns: string,
): number {
  const columns = Number(baseColumns);

  if (baseColumns.trim() === "" || !Number.isInteger(columns)) {
    return FALLBACK_COLUMNS;
  }

  return Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS);
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
  baseColumns: string;
  gap: string;
  iconSize: string;
  onPreviewThemeChange: (previewTheme: StackIconsPreviewTheme) => void;
  previewTheme: StackIconsPreviewTheme;
  slugs: readonly string[];
};

// Always-visible column layout preview: a live client-side recreation of the
// base column layout's generated image source for the selected preview theme.
// Unknown slugs are skipped entirely, matching how generated image sources
// render (ADR 0002).
export function ColumnLayoutPreview({
  baseColumns,
  gap,
  iconSize,
  onPreviewThemeChange,
  previewTheme,
  slugs,
}: ColumnLayoutPreviewProps) {
  const renderableSlugs = slugs.filter(isIconSlug);
  const columns = resolveColumnLayoutPreviewBaseColumns(baseColumns);
  const gapPx =
    Number.isFinite(Number(gap)) && gap.trim() !== ""
      ? Number(gap)
      : FALLBACK_GAP;
  const iconSizePx =
    Number.isFinite(Number(iconSize)) && iconSize.trim() !== ""
      ? Number(iconSize)
      : FALLBACK_ICON_SIZE;
  const stageColumnCount = getColumnLayoutPreviewColumnCount({
    columns,
    gap: gapPx,
    iconCount: renderableSlugs.length,
    iconSize: iconSizePx,
  });

  return (
    <section
      aria-label="Column layout preview"
      className="rounded-[6px] border bg-card text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-[18px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <EyeIcon aria-hidden="true" className="h-4 w-4 text-ink-2" />
          <span className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2">
            Live preview
          </span>
          <span className="rounded-full border bg-surface-3 px-[9px] py-[3px] font-mono text-[10.5px] text-ink-2">
            inline svg · in-browser
          </span>
        </div>
        <div
          aria-label="Preview theme"
          className="inline-flex items-center gap-[3px] rounded-[6px] border bg-surface-3 p-[3px]"
          role="group"
        >
          <PreviewThemeSegmentedButton
            isActive={previewTheme === "light"}
            label="Light"
            onActivate={() => onPreviewThemeChange("light")}
          >
            <SunIcon aria-hidden="true" size={16} />
          </PreviewThemeSegmentedButton>
          <PreviewThemeSegmentedButton
            isActive={previewTheme === "dark"}
            label="Dark"
            onActivate={() => onPreviewThemeChange("dark")}
          >
            <MoonIcon aria-hidden="true" size={16} />
          </PreviewThemeSegmentedButton>
        </div>
      </div>
      <div
        className="mx-5 flex items-center justify-center overflow-x-auto rounded-[6px] border px-4 py-[22px] sm:px-[26px] sm:py-[30px]"
        data-preview-theme={previewTheme}
        style={STAGE_COLORS[previewTheme]}
      >
        {renderableSlugs.length === 0 ? (
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
            {renderableSlugs.map((slug, index) => (
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
      <p className="px-5 pb-[18px] pt-[10px] text-center font-mono text-[11.5px] text-ink-3">
        {`${columns} columns · ${iconSizePx}px icons · gap ${gapPx}px · base layout — exactly what the README shows`}
      </p>
    </section>
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

type PreviewThemeSegmentedButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  label: string;
  onActivate: () => void;
};

// Neutral variant of the segmented control (same treatment as the app-bar UI
// theme toggle): surface-3 track, active segment gets the surface background
// and a small shadow. This switches the IMAGE theme, not the UI chrome theme.
function PreviewThemeSegmentedButton({
  children,
  isActive,
  label,
  onActivate,
}: PreviewThemeSegmentedButtonProps) {
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
