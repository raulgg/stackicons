import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SelectedIconTiles } from "./SelectedIconTiles";

function renderTiles({
  onAddIconRequest = vi.fn(),
  onRemoveSlug = vi.fn(),
  onReorderSlug = vi.fn(),
  slugs = ["typescript", "react", "vercel"],
}: {
  onAddIconRequest?: ReturnType<typeof vi.fn>;
  onRemoveSlug?: ReturnType<typeof vi.fn>;
  onReorderSlug?: ReturnType<typeof vi.fn>;
  slugs?: string[];
} = {}) {
  render(
    <SelectedIconTiles
      onAddIconRequest={onAddIconRequest}
      onRemoveSlug={onRemoveSlug}
      onReorderSlug={onReorderSlug}
      slugs={slugs}
    />,
  );
}

function getTiles() {
  // The last list item is the Add tile, not a selected icon tile.
  return within(screen.getByLabelText("Selected icons"))
    .getAllByRole("listitem")
    .slice(0, -1);
}

describe("SelectedIconTiles", () => {
  it("should render a tile with logo, name, and slug for each selected icon when known slugs are given", () => {
    // Given / When
    renderTiles({ slugs: ["typescript", "react"] });

    // Then
    const [typescriptTile, reactTile] = getTiles();

    expect(typescriptTile).toHaveTextContent("TypeScript");
    expect(typescriptTile).toHaveTextContent("typescript");
    expect(reactTile).toHaveTextContent("React");
    expect(typescriptTile.querySelector("img")).toHaveAttribute(
      "src",
      "/icons?icons=typescript",
    );
    expect(
      screen.getByRole("button", { name: "Remove TypeScript" }),
    ).toBeInTheDocument();
  });

  it("should call onRemoveSlug with the tile position when its remove button is clicked", () => {
    // Given
    const onRemoveSlug = vi.fn();

    renderTiles({ onRemoveSlug });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Remove React" }));

    // Then
    expect(onRemoveSlug).toHaveBeenCalledWith(1);
  });

  it("should reorder the dragged icon to the drop position when a tile is dropped on another tile", () => {
    // Given
    const onReorderSlug = vi.fn();

    renderTiles({ onReorderSlug });

    const [typescriptTile, , vercelTile] = getTiles();

    // When
    fireEvent.dragStart(typescriptTile);
    fireEvent.dragOver(vercelTile);
    fireEvent.drop(vercelTile);

    // Then
    expect(onReorderSlug).toHaveBeenCalledWith(0, 2);
  });

  it("should mark the dragged tile and the drop target while dragging and clear both on dragend", () => {
    // Given
    renderTiles();

    const [typescriptTile, reactTile] = getTiles();

    // When
    fireEvent.dragStart(typescriptTile);
    fireEvent.dragOver(reactTile);

    // Then
    expect(typescriptTile).toHaveClass("opacity-40");
    expect(reactTile).toHaveClass("border-accent");

    // When
    fireEvent.dragEnd(typescriptTile);

    // Then
    expect(typescriptTile).not.toHaveClass("opacity-40");
    expect(reactTile).not.toHaveClass("border-accent");
  });

  it("should render an unknown slug as a danger tile with an unknown sublabel and a monogram", () => {
    // Given / When
    renderTiles({ slugs: ["typescript", "not-real"] });

    // Then
    const [, unknownTile] = getTiles();

    expect(unknownTile).toHaveClass("border-destructive");
    expect(unknownTile).toHaveTextContent("not-real");
    expect(unknownTile).toHaveTextContent("unknown");
    expect(within(unknownTile).getByText("no")).toBeInTheDocument();
    expect(unknownTile.querySelector("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove not-real" }),
    ).toBeInTheDocument();
  });

  it("should call onAddIconRequest when the Add tile is clicked", () => {
    // Given
    const onAddIconRequest = vi.fn();

    renderTiles({ onAddIconRequest });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    // Then
    expect(onAddIconRequest).toHaveBeenCalledTimes(1);
  });
});
