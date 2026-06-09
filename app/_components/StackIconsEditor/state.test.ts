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
      gap: "10",
      icons: "react,nextjs",
      layoutMode: "responsive",
      previewTheme: "dark",
    };

    const params = new URLSearchParams(buildStackIconsEditorPageQuery(state));

    expect(params.get("icons")).toBe("react,nextjs");
    expect(params.get("layout")).toBe("responsive");
    expect(params.get("column-layouts")).toBe(
      JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
      ]),
    );
    expect(params.get("gap")).toBe("10");
    expect(params.has("include-dark-theme")).toBe(false);
    expect(params.get("preview-theme")).toBe("dark");
  });

  it("should round-trip serialized editor state through initial state parsing", () => {
    const state: StackIconsEditorState = {
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      gap: "12",
      icons: "typescript,react",
      layoutMode: "single",
      previewTheme: "light",
    };
    const searchParams = Object.fromEntries(
      new URLSearchParams(buildStackIconsEditorPageQuery(state)),
    );

    expect(getStackIconsEditorInitialState(searchParams)).toEqual(state);
  });
});
