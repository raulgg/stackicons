import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  DEFAULT_SINGLE_COLUMN_LAYOUTS,
  addBreakpointLayout,
  getColumnLayoutPreviewBands,
  getColumnLayoutRichResult,
  getDefaultColumnLayouts,
  getEditableBaseColumnLayout,
  getEditableBreakpointColumnLayouts,
  parseEditableColumnLayouts,
  removeBreakpointLayout,
  validateColumnLayouts,
} from "./column-layout";

describe("column layouts", () => {
  it("should expose default single and responsive column layouts", () => {
    expect(DEFAULT_SINGLE_COLUMN_LAYOUTS).toEqual([
      { columns: "4", minWidthPx: null },
    ]);
    expect(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS).toEqual([
      { columns: "4", minWidthPx: null },
      { columns: "8", minWidthPx: "768" },
      { columns: "12", minWidthPx: "1200" },
    ]);
    expect(getDefaultColumnLayouts("single")).toEqual(
      DEFAULT_SINGLE_COLUMN_LAYOUTS,
    );
    expect(getDefaultColumnLayouts("responsive")).toEqual(
      DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
    );
  });

  it("should parse a single layout from an editable value", () => {
    expect(
      parseEditableColumnLayouts(
        [{ columns: "6", minWidthPx: null }],
        "single",
      ),
    ).toEqual([{ columns: "6", minWidthPx: null }]);
  });

  it("should parse responsive layouts while preserving user order", () => {
    expect(
      parseEditableColumnLayouts(
        [
          { columns: "12", minWidthPx: null },
          { columns: "20", minWidthPx: "1280" },
          { columns: "16", minWidthPx: "768" },
          { columns: "", minWidthPx: "" },
        ],
        "responsive",
      ),
    ).toEqual([
      { columns: "12", minWidthPx: null },
      { columns: "20", minWidthPx: "1280" },
      { columns: "16", minWidthPx: "768" },
      { columns: "", minWidthPx: "" },
    ]);
  });

  it("should reject malformed editable column layout values", () => {
    expect(parseEditableColumnLayouts({ columns: "6" }, "single")).toBeNull();
    expect(
      parseEditableColumnLayouts([{ columns: 6, minWidthPx: null }], "single"),
    ).toBeNull();
    expect(
      parseEditableColumnLayouts(
        [{ columns: "6", minWidthPx: null }],
        "responsive",
      ),
    ).toBeNull();
  });

  it("should validate a responsive layout into numeric column layouts", () => {
    expect(
      validateColumnLayouts({
        columnLayouts: [
          { columns: "12", minWidthPx: null },
          { columns: "20", minWidthPx: "1280" },
          { columns: "16", minWidthPx: "768" },
        ],
        layoutMode: "responsive",
      }),
    ).toEqual({
      success: true,
      columnLayouts: [
        { columns: 12, minWidthPx: null },
        { columns: 20, minWidthPx: 1280 },
        { columns: 16, minWidthPx: 768 },
      ],
    });
  });

  it("should ignore fully empty breakpoint rows during validation", () => {
    expect(
      validateColumnLayouts({
        columnLayouts: [
          { columns: "12", minWidthPx: null },
          { columns: "18", minWidthPx: "768" },
          { columns: "", minWidthPx: "" },
        ],
        layoutMode: "responsive",
      }),
    ).toEqual({
      success: true,
      columnLayouts: [
        { columns: 12, minWidthPx: null },
        { columns: 18, minWidthPx: 768 },
      ],
    });
  });

  it("should reject partially filled breakpoint rows during validation", () => {
    expect(
      validateColumnLayouts({
        columnLayouts: [
          { columns: "12", minWidthPx: null },
          { columns: "18", minWidthPx: "" },
        ],
        layoutMode: "responsive",
      }),
    ).toEqual({
      success: false,
      errors: [
        "Breakpoint rows must include columns and breakpoint px.",
        "Responsive layout mode must have a base layout and at least one breakpoint layout.",
      ],
    });
  });

  it("should reject duplicate breakpoint values", () => {
    expect(
      validateColumnLayouts({
        columnLayouts: [
          { columns: "12", minWidthPx: null },
          { columns: "18", minWidthPx: "768" },
          { columns: "20", minWidthPx: "768" },
        ],
        layoutMode: "responsive",
      }),
    ).toEqual({
      success: false,
      errors: ["Breakpoint px values must be unique."],
    });
  });

  it("should find the editable base column layout", () => {
    expect(
      getEditableBaseColumnLayout([
        { columns: "18", minWidthPx: "768" },
        { columns: "12", minWidthPx: null },
      ]),
    ).toEqual({ columns: "12", minWidthPx: null });
  });

  it("should return editable breakpoint layouts in user order", () => {
    expect(
      getEditableBreakpointColumnLayouts([
        { columns: "12", minWidthPx: null },
        { columns: "20", minWidthPx: "1280" },
        { columns: "16", minWidthPx: "768" },
      ]),
    ).toEqual([
      { layout: { columns: "20", minWidthPx: "1280" }, originalIndex: 1 },
      { layout: { columns: "16", minWidthPx: "768" }, originalIndex: 2 },
    ]);
  });
});

describe("getColumnLayoutRichResult (deepened module validation surface)", () => {
  it("should return a successful rich result with structured errors and preview bands for valid responsive input", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [
        { columns: "12", minWidthPx: null },
        { columns: "8", minWidthPx: "768" },
        { columns: "16", minWidthPx: "1200" },
      ],
      layoutMode: "responsive",
    });

    expect(result.success).toBe(true);
    expect(result.columnLayouts).toEqual([
      { columns: 12, minWidthPx: null },
      { columns: 8, minWidthPx: 768 },
      { columns: 16, minWidthPx: 1200 },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.baseColumns).toEqual([]);
    expect(result.breakpointColumnsByIndex).toEqual({ 1: [], 2: [] });
    expect(result.breakpointMinWidthByIndex).toEqual({ 1: [], 2: [] });
    expect(result.previewBands).toEqual([
      { columns: 12, minWidthPx: null },
      { columns: 8, minWidthPx: 768 },
      { columns: 16, minWidthPx: 1200 },
    ]);
  });

  it("should project base column errors into baseColumns", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [{ columns: "1", minWidthPx: null }],
      layoutMode: "single",
    });

    expect(result.success).toBe(false);
    expect(result.baseColumns).toEqual(["2–20 columns"]);
    expect(result.errors).toContain(
      "Each column layout must use 2 to 20 columns.",
    );
  });

  it("should project breakpoint column and min-width errors", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [
        { columns: "12", minWidthPx: null },
        { columns: "99", minWidthPx: "500" },
        { columns: "5", minWidthPx: "abc" },
      ],
      layoutMode: "responsive",
    });

    expect(result.success).toBe(false);
    expect(result.baseColumns).toEqual([]);
    expect(result.breakpointColumnsByIndex[1]).toEqual(["2–20 columns"]);
    expect(result.breakpointMinWidthByIndex[2]).toEqual(["1–3840px"]);
  });

  it("should detect duplicate breakpoint min-widths", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [
        { columns: "12", minWidthPx: null },
        { columns: "8", minWidthPx: "768" },
        { columns: "6", minWidthPx: "768" },
      ],
      layoutMode: "responsive",
    });

    expect(result.success).toBe(false);
    expect(result.breakpointMinWidthByIndex[1]).toContain(
      "duplicate min-width",
    );
    expect(result.breakpointMinWidthByIndex[2]).toContain(
      "duplicate min-width",
    );
  });

  it("should ignore fully empty breakpoint rows (consistent with validate)", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [
        { columns: "12", minWidthPx: null },
        { columns: "8", minWidthPx: "768" },
        { columns: "", minWidthPx: "" },
      ],
      layoutMode: "responsive",
    });

    expect(result.success).toBe(true);
    expect(result.columnLayouts).toEqual([
      { columns: 12, minWidthPx: null },
      { columns: 8, minWidthPx: 768 },
    ]);
    expect(result.previewBands).toEqual([
      { columns: 12, minWidthPx: null },
      { columns: 8, minWidthPx: 768 },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("should produce preview bands that skip unparseable rows", () => {
    const result = getColumnLayoutRichResult({
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "abc", minWidthPx: "800" },
        { columns: "8", minWidthPx: "1200" },
      ],
      layoutMode: "responsive",
    });

    expect(result.previewBands).toEqual([
      { columns: 4, minWidthPx: null },
      { columns: 8, minWidthPx: 1200 },
    ]);
  });
});

describe("column layout evolution operations (add / remove)", () => {
  it("should add a breakpoint with a unique min-width starting at 768", () => {
    const result = addBreakpointLayout(
      [{ columns: "4", minWidthPx: null }],
      "responsive",
    );

    expect(result).toEqual([
      { columns: "4", minWidthPx: null },
      { columns: "6", minWidthPx: "768" },
    ]);
  });

  it("should avoid existing min-widths when adding", () => {
    const initial = [
      { columns: "4", minWidthPx: null },
      { columns: "8", minWidthPx: "768" },
    ];

    const result = addBreakpointLayout(initial, "responsive");

    expect(result[2].minWidthPx).toBe("1024");
  });

  it("addBreakpointLayout should be a no-op for single mode (returns copy)", () => {
    const initial = [{ columns: "4", minWidthPx: null }];
    const result = addBreakpointLayout(initial, "single");

    expect(result).not.toBe(initial); // should be a copy
    expect(result).toEqual(initial);
  });

  it("should remove a breakpoint row by index", () => {
    const initial = [
      { columns: "4", minWidthPx: null },
      { columns: "8", minWidthPx: "768" },
      { columns: "12", minWidthPx: "1200" },
    ];

    const result = removeBreakpointLayout(initial, 1);

    expect(result).toEqual([
      { columns: "4", minWidthPx: null },
      { columns: "12", minWidthPx: "1200" },
    ]);
  });

  it("should not remove the last remaining breakpoint", () => {
    const initial = [
      { columns: "4", minWidthPx: null },
      { columns: "8", minWidthPx: "768" },
    ];

    const result = removeBreakpointLayout(initial, 1);

    expect(result).toEqual(initial);
  });

  it("remove on non-breakpoint or out of range should return a copy", () => {
    const initial = [{ columns: "4", minWidthPx: null }];
    const result = removeBreakpointLayout(initial, 0);
    expect(result).not.toBe(initial);
    expect(result).toEqual(initial);
  });
});
