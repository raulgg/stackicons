"use client";

import React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getIconLabel,
  isIconSlug,
  listRegisteredIcons,
} from "@/lib/icons/registry";
import { cn } from "@/lib/utils";

const registeredIcons = listRegisteredIcons();

export function parseIconSlugs(icons: string): string[] {
  return icons
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function getIconThumbnailUrl(slug: string): string {
  return `/icons?icons=${encodeURIComponent(slug)}`;
}

function getIconOptionId(slug: string): string {
  return `icon-picker-option-${slug}`;
}

type StackIconPickerProps = {
  describedBy?: string;
  onToggleSlug: (slug: string) => void;
  selectedSlugs: readonly string[];
};

export function StackIconPicker({
  describedBy,
  onToggleSlug,
  selectedSlugs,
}: StackIconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingIcons = registeredIcons.filter(
    (icon) =>
      icon.label.toLowerCase().includes(normalizedQuery) ||
      icon.slug.toLowerCase().includes(normalizedQuery),
  );
  const activeIcon = matchingIcons[activeIndex];

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchInputRef.current?.focus();

    function handlePointerDownOutside(event: MouseEvent | TouchEvent) {
      const container = containerRef.current;

      if (
        container !== null &&
        event.target instanceof Node &&
        !container.contains(event.target)
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

  function openPicker() {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }

  function closePicker() {
    setIsOpen(false);
    triggerRef.current?.focus();
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
      closePicker();
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-controls={isOpen ? "icon-picker-panel" : undefined}
        aria-describedby={describedBy}
        aria-expanded={isOpen}
        className="w-full justify-between font-mono sm:w-80"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPicker();
          }
        }}
        ref={triggerRef}
        type="button"
        variant="outline"
      >
        Add icons
        <ChevronsUpDownIcon
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </Button>
      {isOpen ? (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-md border bg-card text-card-foreground shadow-md sm:w-80"
          id="icon-picker-panel"
        >
          <div className="border-b p-2">
            <Input
              aria-activedescendant={
                activeIcon === undefined
                  ? undefined
                  : getIconOptionId(activeIcon.slug)
              }
              aria-autocomplete="list"
              aria-controls="icon-picker-listbox"
              aria-expanded={true}
              aria-label="Search icons"
              className="h-9 font-mono"
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search icons..."
              ref={searchInputRef}
              role="combobox"
              value={query}
            />
          </div>
          {matchingIcons.length === 0 ? (
            <p className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">
              No icons found.
            </p>
          ) : (
            <ul
              aria-label="Icons"
              className="max-h-64 overflow-y-auto p-1"
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
                        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5",
                        index === activeIndex && "bg-muted",
                      )}
                      id={getIconOptionId(icon.slug)}
                      onClick={() => onToggleSlug(icon.slug)}
                      onMouseEnter={() => setActiveIndex(index)}
                      role="option"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5"
                        loading="lazy"
                        src={getIconThumbnailUrl(icon.slug)}
                      />
                      <span className="flex-1 truncate text-sm">
                        {icon.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {icon.slug}
                      </span>
                      <CheckIcon
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden="true"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

type SelectedIconChipsProps = {
  onRemoveSlug: (slugIndex: number) => void;
  slugs: readonly string[];
};

export function SelectedIconChips({
  onRemoveSlug,
  slugs,
}: SelectedIconChipsProps) {
  if (slugs.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        No icons selected yet.
      </p>
    );
  }

  return (
    <ul aria-label="Selected icons" className="flex flex-wrap gap-2">
      {slugs.map((slug, index) => {
        const isKnownSlug = isIconSlug(slug);
        const label = getIconLabel(slug) ?? slug;

        return (
          <li key={`${slug}-${index}`}>
            <Badge
              className={cn(
                "gap-1.5 rounded-md py-1 font-mono text-xs font-normal",
                isKnownSlug
                  ? "bg-background text-muted-foreground"
                  : "border-destructive bg-destructive/10 text-destructive",
              )}
              variant="outline"
            >
              {isKnownSlug ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4"
                  loading="lazy"
                  src={getIconThumbnailUrl(slug)}
                />
              ) : null}
              <span>{label}</span>
              {isKnownSlug ? null : (
                <span className="sr-only">(unknown icon slug)</span>
              )}
              <button
                aria-label={`Remove ${label}`}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onRemoveSlug(index)}
                type="button"
              >
                <XIcon className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
