import { describe, expect, it } from "vitest";

import {
  buildStackIconsEditorPageQuery,
  getStackIconsEditorInitialState,
  type StackIconsEditorState,
} from "./state";

describe("StackIconsEditor state", () => {
  it("should serialize editor state into page query params", () => {
    const state: StackIconsEditorState = {
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
      ],
      iconSize: "56",
      gap: "10",
      icons: "react,nextjs",
      layoutMode: "responsive",
    };

    const params = new URLSearchParams(buildStackIconsEditorPageQuery(state));

    expect(params.get("s")).toBe("react,nextjs");
    expect(params.get("layout")).toBe("responsive");
    expect(params.get("column-layouts")).toBe(
      JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
      ]),
    );
    expect(params.get("size")).toBe("56");
    expect(params.get("gap")).toBe("10");
    expect(params.has("include-dark-theme")).toBe(false);
    expect(params.has("preview-theme")).toBe(false);
  });

  it("should round-trip serialized editor state through initial state parsing", () => {
    const state: StackIconsEditorState = {
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      iconSize: "32",
      gap: "12",
      icons: "typescript,react",
      layoutMode: "single",
    };
    const searchParams = Object.fromEntries(
      new URLSearchParams(buildStackIconsEditorPageQuery(state)),
    );

    expect(getStackIconsEditorInitialState(searchParams)).toEqual(state);
  });

  it("should default the icon size when the size param is missing", () => {
    expect(getStackIconsEditorInitialState({}).iconSize).toBe("48");
  });

  it.each([
    ["not-a-number", "48"],
    ["", "48"],
    ["40.5", "48"],
    [" 40", "48"],
  ])(
    "should fall back to the default icon size when the size param is %j",
    (size, expectedIconSize) => {
      expect(getStackIconsEditorInitialState({ size }).iconSize).toBe(
        expectedIconSize,
      );
    },
  );

  it.each([
    ["12", "24"],
    ["999", "64"],
    ["47", "48"],
    ["40", "40"],
  ])(
    "should clamp the size param %j to the icon size slider range as %j",
    (size, expectedIconSize) => {
      expect(getStackIconsEditorInitialState({ size }).iconSize).toBe(
        expectedIconSize,
      );
    },
  );
});
