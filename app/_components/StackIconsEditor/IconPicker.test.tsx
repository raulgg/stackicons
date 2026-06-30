import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { listRegisteredIcons } from "@/lib/icons/registry";
import { StackIconPicker } from "./IconPicker";

function ControlledStackIconPicker({
  initialSlugs = [],
}: {
  initialSlugs?: string[];
}) {
  const [selectedSlugs, setSelectedSlugs] = React.useState(initialSlugs);

  return (
    <StackIconPicker
      onAddIconSlugs={(iconSlugs) =>
        setSelectedSlugs((slugs) => [
          ...slugs,
          ...iconSlugs.filter((slug) => !slugs.includes(slug)),
        ])
      }
      onRemoveIconSlugs={(iconSlugs) =>
        setSelectedSlugs((slugs) => {
          const iconSlugSet = new Set(iconSlugs);

          return slugs.filter((slug) => !iconSlugSet.has(slug));
        })
      }
      onToggleSlug={(slug) =>
        setSelectedSlugs((slugs) =>
          slugs.includes(slug)
            ? slugs.filter((selectedSlug) => selectedSlug !== slug)
            : [...slugs, slug],
        )
      }
      selectedSlugs={selectedSlugs}
    />
  );
}

function getSelectAllCheckbox() {
  return screen.getByRole("checkbox", { name: /Select All/ });
}

function getSearchInput() {
  return screen.getByLabelText("Search icons");
}

describe("StackIconPicker", () => {
  it("should open the picker when the search input receives focus", () => {
    // Given
    render(<ControlledStackIconPicker />);

    expect(getSearchInput()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // When
    fireEvent.focus(getSearchInput());

    // Then
    expect(getSearchInput()).toHaveAttribute("aria-expanded", "true");
    expect(getSearchInput()).toHaveAttribute(
      "aria-controls",
      "icon-picker-listbox",
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("should position the dropdown portal when the picker opens", () => {
    // Given
    render(<ControlledStackIconPicker />);

    // When
    fireEvent.focus(getSearchInput());

    // Then — position is set synchronously on open, not after an effect tick
    const dropdownStyle = screen
      .getByRole("listbox")
      .parentElement?.getAttribute("style");

    expect(dropdownStyle).toContain("left:");
    expect(dropdownStyle).toContain("top:");
    expect(dropdownStyle).toContain("width:");
  });

  it("should render the open dropdown in a portal outside the picker's section card", () => {
    // Given — the picker sits inside a card that clips overflowing content
    render(
      <div className="overflow-hidden" data-testid="section-card">
        <ControlledStackIconPicker />
      </div>,
    );

    // When
    fireEvent.focus(getSearchInput());

    // Then — the dropdown escapes the card's clipping context via a portal
    const listbox = screen.getByRole("listbox");

    expect(screen.getByTestId("section-card")).not.toContainElement(listbox);
    expect(document.body).toContainElement(listbox);
  });

  it("should close the picker on mousedown outside but keep it open on inside clicks", () => {
    // Given
    render(
      <div>
        <ControlledStackIconPicker />
        <button type="button">Outside</button>
      </div>,
    );
    fireEvent.focus(getSearchInput());

    // When — mousedown inside the dropdown
    fireEvent.mouseDown(screen.getByRole("listbox"));

    // Then
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // When — mousedown outside the picker
    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));

    // Then
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(getSearchInput()).toHaveAttribute("aria-expanded", "false");
  });

  it("should toggle a row's selection without closing the dropdown when the row is clicked", () => {
    // Given
    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());

    const reactOption = screen.getByRole("option", { name: "React react" });

    expect(reactOption).toHaveAttribute("aria-selected", "false");

    // When — select then deselect
    fireEvent.click(reactOption);

    // Then
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "React react" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // When
    fireEvent.click(screen.getByRole("option", { name: "React react" }));

    // Then
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "React react" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("should filter options to a single registry category when its chip is selected", () => {
    // Given
    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());

    const databaseIcons = listRegisteredIcons().filter(
      (icon) => icon.category === "Databases",
    );

    // When
    fireEvent.click(screen.getByRole("button", { name: "Databases" }));

    // Then
    expect(screen.getByRole("button", { name: "Databases" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getAllByRole("option")).toHaveLength(databaseIcons.length);

    // When — back to All
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    // Then
    expect(screen.getAllByRole("option")).toHaveLength(
      listRegisteredIcons().length,
    );
  });

  it("should combine the search query with the active category filter", () => {
    // Given
    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());
    fireEvent.click(screen.getByRole("button", { name: "Frameworks" }));

    // When
    fireEvent.change(getSearchInput(), { target: { value: "react" } });

    // Then — React is a framework, but react-matching non-frameworks are excluded
    const options = screen.getAllByRole("option");

    expect(
      screen.getByRole("option", { name: "React react" }),
    ).toBeInTheDocument();
    options.forEach((option) => {
      expect(option.textContent?.toLowerCase()).toContain("react");
    });
  });

  it("should show the empty state with the query when nothing matches", () => {
    // Given
    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());

    // When
    fireEvent.change(getSearchInput(), { target: { value: "zzz-nope" } });

    // Then
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(getSearchInput()).not.toHaveAttribute("aria-controls");
    expect(getSelectAllCheckbox()).toBeDisabled();
    expect(getSelectAllCheckbox()).toHaveAccessibleName("Select All (0)");
    expect(screen.getByText('No icons match "zzz-nope".')).toBeInTheDocument();
  });

  it("should select all visible icons when the select-all checkbox is checked", () => {
    // Given
    const databaseIcons = listRegisteredIcons().filter(
      (icon) => icon.category === "Databases",
    );

    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());
    fireEvent.click(screen.getByRole("button", { name: "Databases" }));

    expect(getSelectAllCheckbox()).toHaveAccessibleName(
      `Select All (${databaseIcons.length})`,
    );
    expect(getSelectAllCheckbox()).not.toBeChecked();

    // When
    fireEvent.click(getSelectAllCheckbox());

    // Then
    expect(getSelectAllCheckbox()).toBeChecked();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    databaseIcons.forEach((icon) => {
      expect(
        screen.getByRole("option", {
          name: `${icon.label} ${icon.slug}`,
        }),
      ).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should deselect only visible icons when the select-all checkbox is cleared", () => {
    // Given
    const databaseIcons = listRegisteredIcons().filter(
      (icon) => icon.category === "Databases",
    );

    render(
      <ControlledStackIconPicker
        initialSlugs={["react", ...databaseIcons.map((icon) => icon.slug)]}
      />,
    );
    fireEvent.focus(getSearchInput());
    fireEvent.click(screen.getByRole("button", { name: "Databases" }));

    expect(getSelectAllCheckbox()).toBeChecked();

    // When
    fireEvent.click(getSelectAllCheckbox());

    // Then
    expect(getSelectAllCheckbox()).not.toBeChecked();
    expect(
      screen.queryByRole("option", { name: "React react" }),
    ).not.toBeInTheDocument();
    databaseIcons.forEach((icon) => {
      expect(
        screen.getByRole("option", {
          name: `${icon.label} ${icon.slug}`,
        }),
      ).toHaveAttribute("aria-selected", "false");
    });
  });

  it("should complete a partial visible selection from the indeterminate select-all checkbox", () => {
    // Given
    const databaseIcons = listRegisteredIcons().filter(
      (icon) => icon.category === "Databases",
    );
    const [firstDatabaseIcon] = databaseIcons;

    render(
      <ControlledStackIconPicker initialSlugs={[firstDatabaseIcon.slug]} />,
    );
    fireEvent.focus(getSearchInput());
    fireEvent.click(screen.getByRole("button", { name: "Databases" }));

    expect(getSelectAllCheckbox()).toHaveAttribute(
      "data-state",
      "indeterminate",
    );

    // When — fill in the remaining visible icons
    fireEvent.click(getSelectAllCheckbox());

    // Then
    expect(getSelectAllCheckbox()).toBeChecked();
    databaseIcons.forEach((icon) => {
      expect(
        screen.getByRole("option", {
          name: `${icon.label} ${icon.slug}`,
        }),
      ).toHaveAttribute("aria-selected", "true");
    });

    // When — clear only the visible database icons
    fireEvent.click(getSelectAllCheckbox());

    // Then
    expect(getSelectAllCheckbox()).not.toBeChecked();
    databaseIcons.forEach((icon) => {
      expect(
        screen.getByRole("option", {
          name: `${icon.label} ${icon.slug}`,
        }),
      ).toHaveAttribute("aria-selected", "false");
    });
  });

  it("should scope select all to the current search query", () => {
    // Given
    render(<ControlledStackIconPicker />);
    fireEvent.focus(getSearchInput());
    fireEvent.change(getSearchInput(), { target: { value: "react" } });

    const matchingIcons = listRegisteredIcons().filter(
      (icon) =>
        icon.label.toLowerCase().includes("react") ||
        icon.slug.toLowerCase().includes("react"),
    );

    expect(getSelectAllCheckbox()).toHaveAccessibleName(
      `Select All (${matchingIcons.length})`,
    );

    // When
    fireEvent.click(getSelectAllCheckbox());

    // Then
    matchingIcons.forEach((icon) => {
      expect(
        screen.getByRole("option", {
          name: `${icon.label} ${icon.slug}`,
        }),
      ).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should move the active row with arrows, toggle with Enter without closing, and close with Escape", () => {
    // Given
    const onToggleSlug = vi.fn();

    render(
      <StackIconPicker
        onAddIconSlugs={vi.fn()}
        onRemoveIconSlugs={vi.fn()}
        onToggleSlug={onToggleSlug}
        selectedSlugs={[]}
      />,
    );
    fireEvent.focus(getSearchInput());

    const [firstIcon, secondIcon] = listRegisteredIcons();

    expect(getSearchInput()).toHaveAttribute(
      "aria-activedescendant",
      `icon-picker-option-${firstIcon.slug}`,
    );

    // When
    fireEvent.keyDown(getSearchInput(), { key: "ArrowDown" });

    // Then
    expect(getSearchInput()).toHaveAttribute(
      "aria-activedescendant",
      `icon-picker-option-${secondIcon.slug}`,
    );

    // When
    fireEvent.keyDown(getSearchInput(), { key: "Enter" });

    // Then
    expect(onToggleSlug).toHaveBeenCalledWith(secondIcon.slug);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // When
    fireEvent.keyDown(getSearchInput(), { key: "ArrowUp" });
    fireEvent.keyDown(getSearchInput(), { key: "Escape" });

    // Then
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
