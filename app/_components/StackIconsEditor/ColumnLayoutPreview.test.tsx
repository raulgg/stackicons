import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EditableColumnLayout } from "@/lib/icons/column-layout";
import { getColumnLayoutPreviewBands } from "@/lib/icons/column-layout";
import { getIconGridLayout } from "@/lib/icons/layout";
import {
  ColumnLayoutPreview,
  getColumnLayoutPreviewBandRangeText,
  getColumnLayoutPreviewColumnCount,
} from "./ColumnLayoutPreview";

const KNOWN_SLUGS = [
  "typescript",
  "nextjs",
  "tailwindcss",
  "vercel",
  "react",
  "nodejs",
];

const RESPONSIVE_COLUMN_LAYOUTS: EditableColumnLayout[] = [
  { columns: "4", minWidthPx: null },
  { columns: "8", minWidthPx: "768" },
  { columns: "12", minWidthPx: "1200" },
];

function singleColumnLayouts(baseColumns: string): EditableColumnLayout[] {
  return [{ columns: baseColumns, minWidthPx: null }];
}

function renderColumnLayoutPreview(
  overrides: Partial<React.ComponentProps<typeof ColumnLayoutPreview>> = {},
) {
  return render(
    <ColumnLayoutPreview
      columnLayouts={singleColumnLayouts("4")}
      gap="8"
      iconSize="48"
      layoutMode="single"
      onPreviewThemeChange={vi.fn()}
      previewTheme="light"
      slugs={KNOWN_SLUGS}
      {...overrides}
    />,
  );
}

function getStageIconList() {
  return screen.getByRole("list", { name: "Column layout preview icons" });
}

describe("ColumnLayoutPreview", () => {
  it("should use the same column count as getIconGridLayout when rendering the stage grid", () => {
    // Given — six renderable icons in a 4-column base layout
    renderColumnLayoutPreview({
      columnLayouts: singleColumnLayouts("4"),
      gap: "8",
      iconSize: "48",
    });

    // When — the stage renders (render is the action)
    const { placements } = getIconGridLayout({
      columns: 4,
      gap: 8,
      iconCount: KNOWN_SLUGS.length,
      iconSize: 48,
    });
    const sharedMathColumnCount = new Set(
      placements.map((placement) => placement.x),
    ).size;

    // Then
    expect(getStageIconList().style.gridTemplateColumns).toBe(
      `repeat(${sharedMathColumnCount}, 48px)`,
    );
  });

  it("should clamp the stage column count to the icon count when there are fewer icons than columns", () => {
    // Given — two renderable icons in a 6-column base layout
    renderColumnLayoutPreview({
      columnLayouts: singleColumnLayouts("6"),
      slugs: ["typescript", "react"],
    });

    // When — the stage renders (render is the action)
    const expectedColumnCount = getColumnLayoutPreviewColumnCount({
      columns: 6,
      gap: 8,
      iconCount: 2,
      iconSize: 48,
    });

    // Then — shared math caps the grid at two columns
    expect(expectedColumnCount).toBe(2);
    expect(getStageIconList().style.gridTemplateColumns).toBe(
      "repeat(2, 48px)",
    );
  });

  it("should skip unknown slugs when rendering the stage", () => {
    // Given
    renderColumnLayoutPreview({
      slugs: ["typescript", "not-a-real-slug", "react"],
    });

    // When — the stage renders (render is the action)

    // Then — only the two known icons appear, the unknown slug is absent
    const cells = within(getStageIconList()).getAllByRole("listitem");

    expect(cells).toHaveLength(2);
    expect(screen.getByRole("img", { name: "typescript" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "react" })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "not-a-real-slug" }),
    ).not.toBeInTheDocument();
  });

  it("should show the empty state when no renderable icons remain", () => {
    // Given — only unknown slugs are selected
    renderColumnLayoutPreview({ slugs: ["not-a-real-slug"] });

    // When — the stage renders (render is the action)

    // Then
    expect(
      screen.getByText("Add icons above to see your stack rendered here."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Column layout preview icons" }),
    ).not.toBeInTheDocument();
  });

  it("should request icons with the dark theme and apply dark stage colors when the preview theme is dark", () => {
    // Given
    renderColumnLayoutPreview({ previewTheme: "dark" });

    // When — the stage renders (render is the action)

    // Then — icon URLs carry theme=dark and the stage uses fixed dark colors
    const stageIcon = screen.getByRole("img", {
      name: "typescript",
    }) as HTMLImageElement;

    expect(stageIcon.src).toContain("/icons?icons=typescript&theme=dark");
    expect(getStageIconList().parentElement).toHaveStyle({
      backgroundColor: "#0d1117",
    });
  });

  it("should notify the dark preview theme when the Dark toggle item is pressed", () => {
    // Given — the preview-theme ToggleGroup renders items as Radix single-mode
    // radios (role="radio", aria-checked, data-state="on"/"off").
    const onPreviewThemeChange = vi.fn();

    renderColumnLayoutPreview({ onPreviewThemeChange, previewTheme: "light" });

    const previewThemeGroup = screen.getByRole("group", {
      name: "Preview theme",
    });
    const lightItem = within(previewThemeGroup).getByRole("radio", {
      name: "Light",
    });

    expect(lightItem).toHaveAttribute("aria-checked", "true");
    expect(lightItem).toHaveAttribute("data-state", "on");

    // When
    fireEvent.click(
      within(previewThemeGroup).getByRole("radio", { name: "Dark" }),
    );

    // Then
    expect(onPreviewThemeChange).toHaveBeenCalledWith("dark");
  });

  it("should notify the light preview theme when the Light toggle item is pressed while dark", () => {
    // Given
    const onPreviewThemeChange = vi.fn();

    renderColumnLayoutPreview({ onPreviewThemeChange, previewTheme: "dark" });

    const previewThemeGroup = screen.getByRole("group", {
      name: "Preview theme",
    });
    const darkItem = within(previewThemeGroup).getByRole("radio", {
      name: "Dark",
    });

    expect(darkItem).toHaveAttribute("aria-checked", "true");
    expect(darkItem).toHaveAttribute("data-state", "on");

    // When
    fireEvent.click(
      within(previewThemeGroup).getByRole("radio", { name: "Light" }),
    );

    // Then
    expect(onPreviewThemeChange).toHaveBeenCalledWith("light");
  });

  it("should ignore the empty deselect when the active preview theme item is pressed again", () => {
    // Given — a theme is always selected; pressing the active item must not
    // clear the selection (Radix emits an empty-string deselect we guard).
    const onPreviewThemeChange = vi.fn();

    renderColumnLayoutPreview({ onPreviewThemeChange, previewTheme: "light" });

    // When — the already-active Light item is pressed again
    fireEvent.click(
      within(screen.getByRole("group", { name: "Preview theme" })).getByRole(
        "radio",
        { name: "Light" },
      ),
    );

    // Then — the empty deselect is swallowed, no spurious theme change fires
    expect(onPreviewThemeChange).not.toHaveBeenCalled();
  });

  it("should fall back to a monogram cell when a known icon thumbnail fails to load", () => {
    // Given
    renderColumnLayoutPreview({ slugs: ["typescript"] });

    // When
    fireEvent.error(screen.getByRole("img", { name: "typescript" }));

    // Then
    expect(
      screen.queryByRole("img", { name: "typescript" }),
    ).not.toBeInTheDocument();
    expect(getStageIconList()).toHaveTextContent("ty");
  });

  it("should render with the default base columns when the base columns value is unparseable", () => {
    // Given — an empty base columns value (validation error state)
    renderColumnLayoutPreview({ columnLayouts: singleColumnLayouts("") });

    // When — the stage renders (render is the action)

    // Then — the stage falls back to the default 4 columns instead of blanking
    expect(getStageIconList().style.gridTemplateColumns).toBe(
      "repeat(4, 48px)",
    );
    expect(
      screen.getByText("any width · 48px icons · gap 8px"),
    ).toBeInTheDocument();
  });

  it("should show live layout values in the caption when settings are valid", () => {
    // Given
    renderColumnLayoutPreview({
      columnLayouts: singleColumnLayouts("5"),
      gap: "12",
      iconSize: "32",
    });

    // When — the caption renders (render is the action)

    // Then
    expect(
      screen.getByText("any width · 32px icons · gap 12px"),
    ).toBeInTheDocument();
  });

  it("should show one column-layout tab per band labeled by column count when the layout mode is responsive", () => {
    // Given — a responsive layout with a base layout and two breakpoints
    renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    // When — the preview renders (render is the action)

    // Then — a Base tab plus one tab per breakpoint band, base selected first
    const layoutTabs = screen.getByRole("tablist", {
      name: "Preview column layout",
    });

    const baseTab = within(layoutTabs).getByRole("tab", { name: "Base · 4" });

    expect(baseTab).toHaveAttribute("aria-selected", "true");
    expect(
      within(layoutTabs).getByRole("tab", { name: "8 cols" }),
    ).toHaveAttribute("aria-selected", "false");
    expect(
      within(layoutTabs).getByRole("tab", { name: "12 cols" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("should show a lone Base tab when the layout mode is single", () => {
    // Given
    renderColumnLayoutPreview({
      columnLayouts: singleColumnLayouts("4"),
      layoutMode: "single",
    });

    // When — the preview renders (render is the action)

    // Then — exactly one Base tab, no breakpoint tabs
    const layoutTabs = screen.getByRole("tablist", {
      name: "Preview column layout",
    });

    expect(within(layoutTabs).getAllByRole("tab")).toHaveLength(1);
    expect(
      within(layoutTabs).getByRole("tab", { name: "Base · 4" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("should show a lone Base tab when unparseable column layouts leave fewer than two usable bands", () => {
    // Given — only the base layout has a usable column count
    renderColumnLayoutPreview({
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "", minWidthPx: "768" },
        { columns: "12", minWidthPx: "" },
      ],
      layoutMode: "responsive",
    });

    // When — the preview renders (render is the action)

    // Then
    const layoutTabs = screen.getByRole("tablist", {
      name: "Preview column layout",
    });

    expect(within(layoutTabs).getAllByRole("tab")).toHaveLength(1);
    expect(
      within(layoutTabs).getByRole("tab", { name: "Base · 4" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("should switch the stage and caption to that column layout when a breakpoint tab is selected", () => {
    // Given
    renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    // When — Radix tab triggers activate on pointer-down + focus, not a click
    const breakpointTab = screen.getByRole("tab", { name: "8 cols" });

    fireEvent.mouseDown(breakpointTab);
    fireEvent.focus(breakpointTab);

    // Then — the stage uses the 768px band's columns and the caption follows
    expect(screen.getByRole("tab", { name: "8 cols" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(getStageIconList().style.gridTemplateColumns).toBe(
      `repeat(${KNOWN_SLUGS.length}, 48px)`,
    );
    expect(
      screen.getByText("768–1199px · 48px icons · gap 8px"),
    ).toBeInTheDocument();
  });

  it("should fall back to the base band when the selected band no longer exists after layout edits", () => {
    // Given — the widest band is selected
    const { rerender } = renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    const widestTab = screen.getByRole("tab", { name: "12 cols" });

    fireEvent.mouseDown(widestTab);
    fireEvent.focus(widestTab);

    // When — the 1200px breakpoint layout is removed
    rerender(
      <ColumnLayoutPreview
        columnLayouts={RESPONSIVE_COLUMN_LAYOUTS.slice(0, 2)}
        gap="8"
        iconSize="48"
        layoutMode="responsive"
        onPreviewThemeChange={vi.fn()}
        previewTheme="light"
        slugs={KNOWN_SLUGS}
      />,
    );

    // Then — selection clamps back to the base band
    expect(screen.getByRole("tab", { name: "Base · 4" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText("under 768px · 48px icons · gap 8px"),
    ).toBeInTheDocument();
  });
});

describe("getColumnLayoutPreviewBandRangeText", () => {
  const BANDS = [
    { columns: 4, minWidthPx: null },
    { columns: 8, minWidthPx: 768 },
    { columns: 12, minWidthPx: 1200 },
  ];

  it("should describe each viewport range when bands cover base, middle, and open-ended widths", () => {
    // Given / When / Then
    expect(getColumnLayoutPreviewBandRangeText(0, BANDS)).toBe("under 768px");
    expect(getColumnLayoutPreviewBandRangeText(1, BANDS)).toBe("768–1199px");
    expect(getColumnLayoutPreviewBandRangeText(2, BANDS)).toBe("1200px and up");
  });

  it("should describe the band as any width when it is the only band", () => {
    // Given / When / Then
    expect(
      getColumnLayoutPreviewBandRangeText(0, [
        { columns: 4, minWidthPx: null },
      ]),
    ).toBe("any width");
  });
});
