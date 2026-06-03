import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { readRawSvgAsset } from "./raw-svg-cache";

const fsPromises = vi.hoisted(() => ({
  readFile: vi.fn(async () => '<svg viewBox="0 0 1 1"><path d="M0 0h1v1H0z"/></svg>'),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: fsPromises.readFile,
  },
  readFile: fsPromises.readFile,
}));

describe("raw SVG asset cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reuse the cached raw SVG when the same asset is read again", async () => {
    // Given
    const assetPath = "assets/icons/typescript.svg";

    // When
    const firstRead = await readRawSvgAsset(assetPath);
    const secondRead = await readRawSvgAsset(assetPath);

    // Then
    expect(secondRead).toBe(firstRead);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("should deduplicate concurrent first reads when the same asset is requested", async () => {
    // Given
    const assetPath = "assets/icons/react.svg";

    // When
    const [firstRead, secondRead] = await Promise.all([
      readRawSvgAsset(assetPath),
      readRawSvgAsset(assetPath),
    ]);

    // Then
    expect(secondRead).toBe(firstRead);
    expect(readFile).toHaveBeenCalledTimes(1);
  });
});
