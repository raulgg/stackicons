import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getIconGridLayout } from "@/lib/icons/layout";
import {
  ColumnLayoutPreview,
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

function renderColumnLayoutPreview(
  overrides: Partial<React.ComponentProps<typeof ColumnLayoutPreview>> = {},
) {
  render(
    <ColumnLayoutPreview
      baseColumns="4"
      gap="8"
      iconSize="48"
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
    renderColumnLayoutPreview({ baseColumns: "4", gap: "8", iconSize: "48" });

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
      baseColumns: "6",
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
    renderColumnLayoutPreview({ baseColumns: "" });

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
    renderColumnLayoutPreview({ baseColumns: "5", gap: "12", iconSize: "32" });

    // When — the caption renders (render is the action)

    // Then
    expect(
      screen.getByText(
        "5 columns · 32px icons · gap 12px · base layout — exactly what the README shows",
      ),
    ).toBeInTheDocument();
  });
});
