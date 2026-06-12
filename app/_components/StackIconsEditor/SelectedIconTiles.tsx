"use client";

import React from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { getIconLabel, isIconSlug } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";

import { IconThumbnail } from "./IconThumbnail";

type SelectedIconTilesProps = {
  onAddIconRequest: () => void;
  onRemoveSlug: (slugIndex: number) => void;
  onReorderSlug: (fromIndex: number, toIndex: number) => void;
  slugs: readonly string[];
};

// Draggable tile grid for the selected icons. Tile order is the icon order in
// the generated README image, so drops splice the dragged slug into place.
export function SelectedIconTiles({
  onAddIconRequest,
  onRemoveSlug,
  onReorderSlug,
  slugs,
}: SelectedIconTilesProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  function clearDragState() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function dropOnTile(targetIndex: number) {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderSlug(draggedIndex, targetIndex);
    }
    clearDragState();
  }

  return (
    <ul aria-label="Selected icons" className="mt-2 flex flex-wrap gap-[11px]">
      {slugs.map((slug, index) => (
        <SelectedIconTile
          isBeingDragged={draggedIndex === index}
          isDropTarget={dragOverIndex === index && draggedIndex !== index}
          key={`${slug}-${index}`}
          onDragEnd={clearDragState}
          onDragOverTile={() => setDragOverIndex(index)}
          onDragStartTile={() => setDraggedIndex(index)}
          onDropOnTile={() => dropOnTile(index)}
          onRemove={() => onRemoveSlug(index)}
          slug={slug}
        />
      ))}
      <li>
        <button
          className="flex h-full w-[96px] flex-col items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-border-strong bg-surface-2 px-[10px] pb-[11px] pt-[14px] text-ink-3 hover:border-accent hover:text-accent"
          onClick={onAddIconRequest}
          type="button"
        >
          <PlusIcon aria-hidden="true" className="h-5 w-5" />
          <span className="text-[12.5px] font-semibold">Add</span>
        </button>
      </li>
    </ul>
  );
}

type SelectedIconTileProps = {
  isBeingDragged: boolean;
  isDropTarget: boolean;
  onDragEnd: () => void;
  onDragOverTile: () => void;
  onDragStartTile: () => void;
  onDropOnTile: () => void;
  onRemove: () => void;
  slug: string;
};

function SelectedIconTile({
  isBeingDragged,
  isDropTarget,
  onDragEnd,
  onDragOverTile,
  onDragStartTile,
  onDropOnTile,
  onRemove,
  slug,
}: SelectedIconTileProps) {
  const isKnownSlug = isIconSlug(slug);
  const label = getIconLabel(slug) ?? slug;
  const [hasThumbnailError, setHasThumbnailError] = React.useState(false);
  const shouldShowMonogram = !isKnownSlug || hasThumbnailError;

  return (
    <li
      className={cn(
        "group relative flex w-[96px] cursor-grab flex-col items-center rounded-[6px] border px-[10px] pb-[11px] pt-[14px]",
        isKnownSlug
          ? "border-border-strong hover:border-border-ink hover:shadow-button"
          : "border-dashed border-destructive bg-destructive-soft",
        isBeingDragged && "opacity-40",
        isDropTarget && "border-accent ring-[3px] ring-accent-soft",
      )}
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverTile();
      }}
      onDragStart={(event) => {
        if (event.dataTransfer != null) {
          event.dataTransfer.effectAllowed = "move";
        }
        onDragStartTile();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropOnTile();
      }}
    >
      {shouldShowMonogram ? (
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-surface-3 font-mono text-sm font-semibold text-ink-2"
        >
          {slug.slice(0, 2)}
        </span>
      ) : (
        <IconThumbnail
          className="h-[38px] w-[38px]"
          onError={() => setHasThumbnailError(true)}
          slug={slug}
        />
      )}
      <span className="mt-2 max-w-full truncate text-center text-[12.5px] font-semibold">
        {label}
      </span>
      <span
        className={cn(
          "max-w-full truncate font-mono text-[10px]",
          isKnownSlug ? "text-ink-3" : "text-destructive",
        )}
      >
        {isKnownSlug ? slug : "unknown"}
      </span>
      <span aria-hidden="true" className="mt-2 grid grid-cols-3 gap-[3px]">
        {Array.from({ length: 6 }).map((_dot, dotIndex) => (
          <span
            className="h-[3px] w-[3px] rounded-full bg-border-ink"
            key={dotIndex}
          />
        ))}
      </span>
      <button
        aria-label={`Remove ${label}`}
        className="absolute right-[6px] top-[6px] flex h-5 w-5 items-center justify-center rounded-[6px] bg-surface-3 text-ink-2 opacity-0 hover:bg-destructive hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
        onClick={onRemove}
        type="button"
      >
        <XIcon aria-hidden="true" className="h-3 w-3" />
      </button>
    </li>
  );
}
