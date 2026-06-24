import { describe, expect, it } from "vitest";

import {
  ADD_ICONS_IMAGE_CODE_PLACEHOLDER,
  FIX_ERRORS_IMAGE_CODE_PLACEHOLDER,
} from "@/app/_components/readme";

import { getIconsImageCodeEmptyPlaceholder } from "./useStackIconsEditorForm";

describe("getIconsImageCodeEmptyPlaceholder", () => {
  it("should return the add-icons placeholder when no icons are selected", () => {
    expect(
      getIconsImageCodeEmptyPlaceholder({
        hasIcons: false,
        validationErrorCount: 0,
      }),
    ).toBe(ADD_ICONS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should return the fix-errors placeholder when icons are present and validation failed", () => {
    expect(
      getIconsImageCodeEmptyPlaceholder({
        hasIcons: true,
        validationErrorCount: 1,
      }),
    ).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should omit a placeholder when icons are present but generation is not blocked by validation", () => {
    expect(
      getIconsImageCodeEmptyPlaceholder({
        hasIcons: true,
        validationErrorCount: 0,
      }),
    ).toBeUndefined();
  });
});
