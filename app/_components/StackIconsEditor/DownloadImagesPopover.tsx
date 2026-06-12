"use client";

import React from "react";
import { CheckIcon, DownloadIcon } from "lucide-react";

import { showToast } from "@/components/ui/sonner";
import { buildGeneratedImageSourceZip } from "@/lib/icons/generated-image-zip";
import type { GeneratedImageSource } from "@/lib/icons/readme-image";
import { cn } from "@/lib/utils";

const DOWNLOAD_ZIP_FILE_NAME = "stack-icons.zip";

export type DownloadMatrixRow = {
  columns: number;
  minWidthPx: number | null;
};

// One matrix row per unique column layout: the light/dark generated image
// source pair for the same column layout collapses into a single row.
export function getDownloadMatrixRows(
  imageSources: readonly GeneratedImageSource[],
): DownloadMatrixRow[] {
  const rows: DownloadMatrixRow[] = [];

  for (const imageSource of imageSources) {
    if (!rows.some((row) => row.minWidthPx === imageSource.minWidthPx)) {
      rows.push({
        columns: imageSource.columns,
        minWidthPx: imageSource.minWidthPx,
      });
    }
  }

  return rows;
}

function getMatrixCellKey(
  minWidthPx: number | null,
  theme: GeneratedImageSource["theme"],
): string {
  return `${minWidthPx ?? "base"}-${theme}`;
}

function triggerZipDownload(zipBytes: Uint8Array) {
  const zipBlob = new Blob([zipBytes as BlobPart], {
    type: "application/zip",
  });
  const zipObjectUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");

  anchor.href = zipObjectUrl;
  anchor.download = DOWNLOAD_ZIP_FILE_NAME;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(zipObjectUrl);
}

type DownloadImagesPopoverProps = {
  generatedImageSources: readonly GeneratedImageSource[];
  isDisabled: boolean;
};

// Download button plus popover with the theme × breakpoint variant matrix.
// Matrix selection is ephemeral UI state: every open resets all cells to
// checked. Selected cells map to generated image sources, which download as
// one client-side zip of SVG files.
export function DownloadImagesPopover({
  generatedImageSources,
  isDisabled,
}: DownloadImagesPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCellKeys, setSelectedCellKeys] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [isDownloading, setIsDownloading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const matrixRows = getDownloadMatrixRows(generatedImageSources);
  const selectedSources = generatedImageSources.filter((imageSource) =>
    selectedCellKeys.has(
      getMatrixCellKey(imageSource.minWidthPx, imageSource.theme),
    ),
  );

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  function togglePopover() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // Every open resets the whole matrix to checked.
    setSelectedCellKeys(
      new Set(
        generatedImageSources.map((imageSource) =>
          getMatrixCellKey(imageSource.minWidthPx, imageSource.theme),
        ),
      ),
    );
    setIsOpen(true);
  }

  function toggleMatrixCell(cellKey: string) {
    setSelectedCellKeys((currentCellKeys) => {
      const nextCellKeys = new Set(currentCellKeys);

      if (nextCellKeys.has(cellKey)) {
        nextCellKeys.delete(cellKey);
      } else {
        nextCellKeys.add(cellKey);
      }

      return nextCellKeys;
    });
  }

  async function downloadSelectedImageSources() {
    if (selectedSources.length === 0) {
      showToast("Select at least one variant");
      return;
    }

    setIsDownloading(true);

    try {
      const { failedCount, succeededCount, zipBytes } =
        await buildGeneratedImageSourceZip(selectedSources);

      if (zipBytes === null) {
        showToast("Download failed — could not fetch any images");
        return;
      }

      triggerZipDownload(zipBytes);
      showToast(
        failedCount > 0
          ? `Downloaded ${succeededCount}, ${failedCount} failed`
          : `Downloading ${succeededCount} image${succeededCount === 1 ? "" : "s"}`,
      );
      setIsOpen(false);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Download"
        className="flex h-8 w-8 items-center justify-center rounded-[6px] text-ink-2 hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-45"
        disabled={isDisabled}
        onClick={togglePopover}
        type="button"
      >
        <DownloadIcon aria-hidden="true" size={16} />
      </button>
      {isOpen ? (
        <div
          aria-label="Download images"
          className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[312px] rounded-[6px] border border-border-strong bg-popover p-4 text-popover-foreground shadow-overlay"
          role="dialog"
        >
          <p className="text-[14.5px] font-semibold">Download images</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2">
            Pick variants — theme × breakpoint
          </p>
          <div
            className="mt-3 grid items-center"
            style={{
              gap: "9px 8px",
              gridTemplateColumns: "1fr 40px 40px",
            }}
          >
            <span aria-hidden="true" />
            <span className="text-center font-mono text-[10px] uppercase tracking-[0.07em] text-ink-3">
              Light
            </span>
            <span className="text-center font-mono text-[10px] uppercase tracking-[0.07em] text-ink-3">
              Dark
            </span>
            {matrixRows.map((row) => {
              const rowLabel =
                row.minWidthPx === null ? "Base" : `≥ ${row.minWidthPx}`;

              return (
                <React.Fragment key={row.minWidthPx ?? "base"}>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-semibold">
                      {rowLabel}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-3">
                      {row.columns} columns
                    </span>
                  </span>
                  {(["light", "dark"] as const).map((theme) => {
                    const cellKey = getMatrixCellKey(row.minWidthPx, theme);
                    const isChecked = selectedCellKeys.has(cellKey);

                    return (
                      <span className="flex justify-center" key={theme}>
                        <button
                          aria-checked={isChecked}
                          aria-label={`${rowLabel} ${theme}`}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-[8px]",
                            isChecked
                              ? "bg-accent text-white"
                              : "border-[1.5px] border-border-ink bg-surface",
                          )}
                          onClick={() => toggleMatrixCell(cellKey)}
                          role="checkbox"
                          type="button"
                        >
                          {isChecked ? (
                            <CheckIcon
                              aria-hidden="true"
                              size={16}
                              strokeWidth={2.5}
                            />
                          ) : null}
                        </button>
                      </span>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-[13px]">
            <span className="font-mono text-[12px] text-ink-2">
              {`${selectedSources.length} of ${generatedImageSources.length} selected`}
            </span>
            <button
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent px-[13px] py-[7px] text-[13px] font-semibold text-white disabled:opacity-45"
              disabled={isDownloading}
              onClick={downloadSelectedImageSources}
              type="button"
            >
              <DownloadIcon aria-hidden="true" size={16} />
              Download .zip
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
