"use client";

import React from "react";
import { createPortal } from "react-dom";
import { CheckIcon, SearchIcon } from "lucide-react";

import {
  listIconCategories,
  listRegisteredIcons,
  type IconCategory,
} from "@/lib/icons/registry";
import { cn } from "@/lib/utils";

import { IconThumbnail } from "./IconThumbnail";

const registeredIcons = listRegisteredIcons();
const iconCategories = listIconCategories();

export function parseIconSlugs(icons: string): string[] {
  return icons
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function getIconOptionId(slug: string): string {
  return `icon-picker-option-${slug}`;
}

type CategoryFilter = "All" | IconCategory;

type StackIconPickerProps = {
  describedBy?: string;
  onToggleSlug: (slug: string) => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
  selectedSlugs: readonly string[];
};

export function StackIconPicker({
  describedBy,
  onToggleSlug,
  searchInputRef,
  selectedSlugs,
}: StackIconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] =
    React.useState<CategoryFilter>("All");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const searchWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingIcons = registeredIcons.filter(
    (icon) =>
      (categoryFilter === "All" || icon.category === categoryFilter) &&
      (icon.label.toLowerCase().includes(normalizedQuery) ||
        icon.slug.toLowerCase().includes(normalizedQuery)),
  );
  const activeIcon = matchingIcons[activeIndex];

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDownOutside(event: MouseEvent | TouchEvent) {
      const container = containerRef.current;

      if (
        container !== null &&
        event.target instanceof Node &&
        !container.contains(event.target) &&
        !(dropdownRef.current?.contains(event.target) ?? false)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
    };
  }, [isOpen]);

  // The dropdown portals to document.body so the EditorSection card's
  // overflow-hidden cannot clip it. Position is derived from the search
  // input's bounding rect and kept in sync while the picker is open.
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateDropdownPosition() {
      const searchWrapper = searchWrapperRef.current;

      if (searchWrapper === null) {
        return;
      }

      const rect = searchWrapper.getBoundingClientRect();

      setDropdownPosition({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        width: rect.width,
      });
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen]);

  function openPicker() {
    setActiveIndex(0);
    setIsOpen(true);
  }

  function selectCategoryFilter(category: CategoryFilter) {
    setCategoryFilter(category);
    setActiveIndex(0);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, matchingIcons.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIcon !== undefined) {
        onToggleSlug(activeIcon.slug);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
  }

  return (
    <div ref={containerRef}>
      <div className="relative" ref={searchWrapperRef}>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-[13px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-ink-3"
        />
        <input
          aria-activedescendant={
            isOpen && activeIcon !== undefined
              ? getIconOptionId(activeIcon.slug)
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={isOpen ? "icon-picker-listbox" : undefined}
          aria-describedby={describedBy}
          aria-expanded={isOpen}
          aria-label="Search icons"
          className="w-full rounded-[6px] border border-border-strong bg-card py-[11px] pl-10 pr-[13px] text-sm text-foreground placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-[var(--focus-ring)]"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onFocus={openPicker}
          onKeyDown={handleSearchKeyDown}
          placeholder='Search 40+ tech icons — "react", "postgres", "docker"…'
          ref={searchInputRef}
          role="combobox"
          type="text"
          value={query}
        />
      </div>
      {isOpen
        ? dropdownPosition !== null
          ? createPortal(
              <div
                className="absolute z-50 rounded-[6px] border border-border-strong bg-popover p-[7px] text-popover-foreground shadow-overlay"
                ref={dropdownRef}
                style={{
                  left: dropdownPosition.left,
                  top: dropdownPosition.top,
                  width: dropdownPosition.width,
                }}
              >
                <div
                  aria-label="Filter icons by category"
                  className="mb-2 flex flex-wrap gap-[7px] px-1 pt-1"
                  role="group"
                >
                  {(["All", ...iconCategories] as const).map((category) => {
                    const isActiveCategory = category === categoryFilter;

                    return (
                      <button
                        aria-pressed={isActiveCategory}
                        className={cn(
                          "rounded-full border px-3 py-[5px] font-mono text-[11.5px] font-medium",
                          isActiveCategory
                            ? "border-foreground bg-foreground text-background"
                            : "border-border-strong text-ink-2 hover:bg-surface-2",
                        )}
                        key={category}
                        onClick={() => selectCategoryFilter(category)}
                        onMouseDown={(event) => event.preventDefault()}
                        type="button"
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
                {matchingIcons.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-ink-3">
                    No icons match &quot;{query}&quot;.
                  </p>
                ) : (
                  <ul
                    aria-label="Icons"
                    className="max-h-[340px] overflow-y-auto"
                    id="icon-picker-listbox"
                    role="listbox"
                  >
                    {matchingIcons.map((icon, index) => {
                      const isSelected = selectedSlugs.includes(icon.slug);

                      return (
                        <li key={icon.slug} role="presentation">
                          <div
                            aria-selected={isSelected}
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 rounded-[7px] px-[11px] py-[9px] hover:bg-surface-3",
                              index === activeIndex && "bg-surface-3",
                            )}
                            id={getIconOptionId(icon.slug)}
                            onClick={() => onToggleSlug(icon.slug)}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            role="option"
                          >
                            <IconThumbnail
                              className="h-[22px] w-[22px]"
                              slug={icon.slug}
                            />
                            <span className="truncate text-sm font-medium">
                              {icon.label}
                            </span>
                            <span className="flex-1 truncate font-mono text-[11px] text-ink-3">
                              {icon.slug}
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                                isSelected
                                  ? "bg-accent text-white"
                                  : "border-[1.5px] border-border-ink",
                              )}
                            >
                              {isSelected ? (
                                <CheckIcon className="h-3.5 w-3.5" />
                              ) : null}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>,
              document.body,
            )
          : null
        : null}
    </div>
  );
}
