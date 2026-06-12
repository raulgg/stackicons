import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EditableColumnLayout } from "@/lib/icons/column-layout";
import { getIconGridLayout } from "@/lib/icons/layout";
import {
  ColumnLayoutPreview,
  getColumnLayoutPreviewBandRangeText,
  getColumnLayoutPreviewBands,
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
      backgroundColor: "#16181B",
    });
  });

  it("should notify the preview theme change when the Dark segment is pressed", () => {
    // Given
    const onPreviewThemeChange = vi.fn();

    renderColumnLayoutPreview({ onPreviewThemeChange, previewTheme: "light" });

    const previewThemeGroup = screen.getByRole("group", {
      name: "Preview theme",
    });

    expect(
      within(previewThemeGroup).getByRole("button", { name: "Light" }),
    ).toHaveAttribute("aria-pressed", "true");

    // When
    fireEvent.click(
      within(previewThemeGroup).getByRole("button", { name: "Dark" }),
    );

    // Then
    expect(onPreviewThemeChange).toHaveBeenCalledWith("dark");
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
      screen.getByText(
        "4 columns · 48px icons · gap 8px · base layout — exactly what the README shows",
      ),
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
      screen.getByText(
        "5 columns · 32px icons · gap 12px · base layout — exactly what the README shows",
      ),
    ).toBeInTheDocument();
  });

  it("should show one breakpoint band picker card per column layout when the layout mode is responsive", () => {
    // Given — a responsive layout with a base layout and two breakpoints
    renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    // When — the preview renders (render is the action)

    // Then — three cards sorted narrow to wide, base selected by default
    expect(
      screen.getByText("Responsive preview — choose a viewport range"),
    ).toBeInTheDocument();

    const baseBandCard = screen.getByRole("button", {
      name: "4 columns under 768px",
    });

    expect(baseBandCard).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "8 columns 768–1199px" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "12 columns 1200px and up" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("should hide the breakpoint band picker when the layout mode is single", () => {
    // Given
    renderColumnLayoutPreview({
      columnLayouts: singleColumnLayouts("4"),
      layoutMode: "single",
    });

    // When — the preview renders (render is the action)

    // Then
    expect(
      screen.queryByText("Responsive preview — choose a viewport range"),
    ).not.toBeInTheDocument();
  });

  it("should hide the breakpoint band picker when unparseable column layouts leave fewer than two usable bands", () => {
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
    expect(
      screen.queryByText("Responsive preview — choose a viewport range"),
    ).not.toBeInTheDocument();
  });

  it("should switch the stage and caption to that column layout when a breakpoint band is clicked", () => {
    // Given
    renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "8 columns 768–1199px" }),
    );

    // Then — the stage uses the 768px band's columns and the caption follows
    expect(
      screen.getByRole("button", { name: "8 columns 768–1199px" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(getStageIconList().style.gridTemplateColumns).toBe(
      `repeat(${KNOWN_SLUGS.length}, 48px)`,
    );
    expect(
      screen.getByText(
        "8 columns · 48px icons · gap 8px · ≥ 768px viewport — exactly what the README shows",
      ),
    ).toBeInTheDocument();
  });

  it("should fall back to the base band when the selected band no longer exists after layout edits", () => {
    // Given — the widest band is selected
    const { rerender } = renderColumnLayoutPreview({
      columnLayouts: RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "12 columns 1200px and up" }),
    );

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
    expect(
      screen.getByRole("button", { name: "4 columns under 768px" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(
        "4 columns · 48px icons · gap 8px · base layout — exactly what the README shows",
      ),
    ).toBeInTheDocument();
  });
});

describe("getColumnLayoutPreviewBands", () => {
  it("should sort bands by min-width ascending with the base band first when layouts arrive unordered", () => {
    // Given / When
    const bands = getColumnLayoutPreviewBands([
      { columns: "12", minWidthPx: "1200" },
      { columns: "4", minWidthPx: null },
      { columns: "8", minWidthPx: "768" },
    ]);

    // Then
    expect(bands).toEqual([
      { columns: 4, minWidthPx: null },
      { columns: 8, minWidthPx: 768 },
      { columns: 12, minWidthPx: 1200 },
    ]);
  });

  it("should skip column layouts with unparseable columns or min-width when building bands", () => {
    // Given / When
    const bands = getColumnLayoutPreviewBands([
      { columns: "4", minWidthPx: null },
      { columns: "", minWidthPx: "768" },
      { columns: "abc", minWidthPx: "900" },
      { columns: "10", minWidthPx: "not-a-number" },
      { columns: "12", minWidthPx: "1200" },
    ]);

    // Then — only the base layout and the 1200px breakpoint remain
    expect(bands).toEqual([
      { columns: 4, minWidthPx: null },
      { columns: 12, minWidthPx: 1200 },
    ]);
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
