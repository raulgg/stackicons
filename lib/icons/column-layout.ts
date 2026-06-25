export type EditableColumnLayout = {
  columns: string;
  minWidthPx: string | null;
};

type EditableBreakpointColumnLayout = EditableColumnLayout & {
  minWidthPx: string;
};

export type ColumnLayout = {
  columns: number;
  minWidthPx: number | null;
};

export type ColumnLayoutValidationResult =
  | {
      success: true;
      columnLayouts: ColumnLayout[];
    }
  | {
      success: false;
      errors: string[];
    };

const DEFAULT_BASE_COLUMNS = "4";
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 20;
const FALLBACK_COLUMNS = 4;
const COLUMNS_RANGE_ERROR = "2–20 columns";
const MIN_WIDTH_RANGE_ERROR = "1–3840px";
const DUPLICATE_MIN_WIDTH_ERROR = "duplicate min-width";
const ADDED_BREAKPOINT_COLUMNS = "6";
const ADDED_BREAKPOINT_MIN_WIDTH_PX = 768;
const ADDED_BREAKPOINT_MIN_WIDTH_STEP_PX = 256;

export const DEFAULT_COLUMN_LAYOUTS: EditableColumnLayout[] = [
  { columns: DEFAULT_BASE_COLUMNS, minWidthPx: null },
];

export function getEditableBaseColumnLayout(
  columnLayouts: readonly EditableColumnLayout[],
): EditableColumnLayout {
  return (
    columnLayouts.find((layout) => layout.minWidthPx === null) ??
    columnLayouts[0] ??
    DEFAULT_COLUMN_LAYOUTS[0]
  );
}

export function getEditableBreakpointColumnLayouts(
  columnLayouts: readonly EditableColumnLayout[],
): Array<{
  layout: EditableBreakpointColumnLayout;
  originalIndex: number;
}> {
  return columnLayouts
    .map((layout, originalIndex) => ({ layout, originalIndex }))
    .filter(
      (
        item,
      ): item is {
        layout: EditableBreakpointColumnLayout;
        originalIndex: number;
      } => item.layout.minWidthPx !== null,
    );
}

export function parseEditableColumnLayouts(
  value: unknown,
): EditableColumnLayout[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  if (!value.every(isEditableColumnLayout)) {
    return null;
  }

  const columnLayouts = value as EditableColumnLayout[];
  const baseLayouts = columnLayouts.filter(
    (layout) => layout.minWidthPx === null,
  );

  if (
    baseLayouts.length !== 1 ||
    parseColumns(baseLayouts[0].columns) === null
  ) {
    return null;
  }

  return copyEditableColumnLayouts(columnLayouts);
}

export function validateColumnLayouts({
  columnLayouts,
}: {
  columnLayouts: readonly EditableColumnLayout[];
}): ColumnLayoutValidationResult {
  const errors: string[] = [];
  const baseLayouts = columnLayouts.filter(
    (layout) => layout.minWidthPx === null,
  );
  const breakpointLayouts = columnLayouts.filter(
    (layout): layout is EditableBreakpointColumnLayout =>
      layout.minWidthPx !== null,
  );
  const parsedBaseLayouts = baseLayouts.map(parseBaseColumnLayout);
  const parsedBreakpointLayouts = breakpointLayouts.flatMap((layout) =>
    parseBreakpointColumnLayout(layout, errors),
  );

  if (columnLayouts.length === 0) {
    errors.push("At least one column layout is required.");
  }

  if (baseLayouts.length !== 1) {
    errors.push("Exactly one base column layout is required.");
  }

  if (
    parsedBaseLayouts.some((layout) => layout === null) ||
    parsedBreakpointLayouts.some((layout) => layout === null)
  ) {
    errors.push("Each column layout must use 2 to 20 columns.");
  }

  const validBreakpointLayouts = parsedBreakpointLayouts.filter(
    (layout): layout is ColumnLayout & { minWidthPx: number } =>
      layout !== null,
  );

  if (
    new Set(validBreakpointLayouts.map((layout) => layout.minWidthPx)).size !==
    validBreakpointLayouts.length
  ) {
    errors.push("Breakpoint px values must be unique.");
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors: Array.from(new Set(errors)),
    };
  }

  const baseLayout = parsedBaseLayouts.find(
    (layout): layout is ColumnLayout & { minWidthPx: null } => layout !== null,
  );

  return {
    success: true,
    columnLayouts:
      baseLayout === undefined
        ? validBreakpointLayouts
        : [baseLayout, ...validBreakpointLayouts],
  };
}

export function copyEditableColumnLayouts(
  columnLayouts: readonly EditableColumnLayout[],
): EditableColumnLayout[] {
  return columnLayouts.map((layout) => ({ ...layout }));
}

function parseBaseColumnLayout(
  layout: EditableColumnLayout,
): (ColumnLayout & { minWidthPx: null }) | null {
  const columns = parseColumns(layout.columns);

  return columns === null ? null : { columns, minWidthPx: null };
}

function parseBreakpointColumnLayout(
  layout: EditableBreakpointColumnLayout,
  errors: string[],
): Array<(ColumnLayout & { minWidthPx: number }) | null> {
  const hasColumns = layout.columns !== "";
  const hasMinWidth = layout.minWidthPx !== "";

  if (!hasColumns && !hasMinWidth) {
    return [];
  }

  if (!hasColumns || !hasMinWidth) {
    errors.push("Breakpoint rows must include columns and breakpoint px.");
    return [];
  }

  const columns = parseColumns(layout.columns);
  const minWidthPx = parseBreakpointMinWidth(layout.minWidthPx);

  if (minWidthPx === null) {
    errors.push("Breakpoint px must be an integer from 1 to 3840.");
  }

  return [
    columns === null || minWidthPx === null ? null : { columns, minWidthPx },
  ];
}

function isEditableColumnLayout(value: unknown): value is EditableColumnLayout {
  return (
    typeof value === "object" &&
    value !== null &&
    "columns" in value &&
    typeof value.columns === "string" &&
    "minWidthPx" in value &&
    (value.minWidthPx === null || typeof value.minWidthPx === "string")
  );
}

function parseColumns(value: string): number | null {
  const columns = Number(value);

  return Number.isInteger(columns) && columns >= 2 && columns <= 20
    ? columns
    : null;
}

function parseBreakpointMinWidth(value: string): number | null {
  if (value.trim() !== value || value === "") {
    return null;
  }

  const breakpointPx = Number(value);

  return Number.isInteger(breakpointPx) &&
    breakpointPx >= 1 &&
    breakpointPx <= 3840
    ? breakpointPx
    : null;
}

export type ColumnLayoutPreviewBand = {
  columns: number;
  minWidthPx: number | null;
};

export type ColumnLayoutRichResult = {
  success: boolean;
  columnLayouts: ColumnLayout[];
  errors: string[];
  baseColumns: string[];
  breakpointColumnsByIndex: Record<number, string[]>;
  breakpointMinWidthByIndex: Record<number, string[]>;
  previewBands: ColumnLayoutPreviewBand[];
};

export function projectColumnLayoutFormErrors(
  columnLayouts: readonly EditableColumnLayout[],
): {
  baseColumns: string[];
  breakpointColumnsByIndex: Record<number, string[]>;
  breakpointMinWidthByIndex: Record<number, string[]>;
} {
  const baseColumns: string[] = [];
  const breakpointColumnsByIndex: Record<number, string[]> = {};
  const breakpointMinWidthByIndex: Record<number, string[]> = {};
  const minWidthLayoutsByValue = new Map<string, number[]>();

  columnLayouts.forEach((layout, index) => {
    if (layout.minWidthPx === null) {
      if (!isIntegerInRange(layout.columns, 2, 20)) {
        baseColumns.push(COLUMNS_RANGE_ERROR);
      }
      return;
    }

    const columnsErrors: string[] = [];
    const minWidthErrors: string[] = [];
    const hasColumns = layout.columns !== "";
    const hasMinWidth = layout.minWidthPx !== "";

    if (
      (hasColumns || hasMinWidth) &&
      !isIntegerInRange(layout.columns, 2, 20)
    ) {
      columnsErrors.push(COLUMNS_RANGE_ERROR);
    }

    if (
      (hasColumns || hasMinWidth) &&
      !isIntegerInRange(layout.minWidthPx, 1, 3840)
    ) {
      minWidthErrors.push(MIN_WIDTH_RANGE_ERROR);
    }

    if (isIntegerInRange(layout.minWidthPx, 1, 3840)) {
      minWidthLayoutsByValue.set(layout.minWidthPx, [
        ...(minWidthLayoutsByValue.get(layout.minWidthPx) ?? []),
        index,
      ]);
    }

    breakpointColumnsByIndex[index] = columnsErrors;
    breakpointMinWidthByIndex[index] = minWidthErrors;
  });

  for (const duplicatedIndexes of minWidthLayoutsByValue.values()) {
    if (duplicatedIndexes.length <= 1) {
      continue;
    }

    duplicatedIndexes.forEach((index) => {
      breakpointMinWidthByIndex[index] = [
        ...(breakpointMinWidthByIndex[index] ?? []),
        DUPLICATE_MIN_WIDTH_ERROR,
      ];
    });
  }

  return { baseColumns, breakpointColumnsByIndex, breakpointMinWidthByIndex };
}

export function getColumnLayoutRichResult({
  columnLayouts,
}: {
  columnLayouts: readonly EditableColumnLayout[];
}): ColumnLayoutRichResult {
  const validation = validateColumnLayouts({ columnLayouts });
  const { baseColumns, breakpointColumnsByIndex, breakpointMinWidthByIndex } =
    projectColumnLayoutFormErrors(columnLayouts);
  const previewBands = getColumnLayoutPreviewBands(columnLayouts);

  return {
    success: validation.success,
    columnLayouts: validation.success ? validation.columnLayouts : [],
    errors: validation.success ? [] : validation.errors,
    baseColumns,
    breakpointColumnsByIndex,
    breakpointMinWidthByIndex,
    previewBands,
  };
}

function isIntegerInRange(value: string, min: number, max: number): boolean {
  const numberValue = Number(value);

  return (
    value.trim() === value &&
    Number.isInteger(numberValue) &&
    numberValue >= min &&
    numberValue <= max
  );
}

export function getColumnLayoutPreviewBands(
  columnLayouts: readonly EditableColumnLayout[],
): ColumnLayoutPreviewBand[] {
  const bands: ColumnLayoutPreviewBand[] = [];

  for (const layout of columnLayouts) {
    const columns = parsePositiveInteger(layout.columns);

    if (columns === null) {
      continue;
    }

    if (layout.minWidthPx === null) {
      bands.push({
        columns: Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS),
        minWidthPx: null,
      });
      continue;
    }

    const minWidthPx = parsePositiveInteger(layout.minWidthPx);

    if (minWidthPx === null) {
      continue;
    }

    bands.push({
      columns: Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS),
      minWidthPx,
    });
  }

  return bands.sort((bandA, bandB) => {
    if (bandA.minWidthPx === null) {
      return bandB.minWidthPx === null ? 0 : -1;
    }

    if (bandB.minWidthPx === null) {
      return 1;
    }

    return bandA.minWidthPx - bandB.minWidthPx;
  });
}

function parsePositiveInteger(value: string): number | null {
  const numberValue = Number(value);

  if (
    value.trim() === "" ||
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
}

export function resolveColumnLayoutPreviewBaseColumns(
  baseColumns: string,
): number {
  const columns = Number(baseColumns);

  if (baseColumns.trim() === "" || !Number.isInteger(columns)) {
    return FALLBACK_COLUMNS;
  }

  return Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS);
}

export function getNextAvailableBreakpointMinWidthPx(
  columnLayouts: readonly EditableColumnLayout[],
): string {
  const takenMinWidths = new Set(
    columnLayouts
      .map((layout) => Number(layout.minWidthPx))
      .filter((minWidthPx) => Number.isFinite(minWidthPx)),
  );
  let minWidthPx = ADDED_BREAKPOINT_MIN_WIDTH_PX;

  while (takenMinWidths.has(minWidthPx)) {
    minWidthPx += ADDED_BREAKPOINT_MIN_WIDTH_STEP_PX;
  }

  return String(minWidthPx);
}

export function addBreakpointLayout(
  columnLayouts: readonly EditableColumnLayout[],
): EditableColumnLayout[] {
  return [
    ...copyEditableColumnLayouts(columnLayouts),
    {
      columns: ADDED_BREAKPOINT_COLUMNS,
      minWidthPx: getNextAvailableBreakpointMinWidthPx(columnLayouts),
    },
  ];
}

export function removeBreakpointLayout(
  columnLayouts: readonly EditableColumnLayout[],
  layoutIndex: number,
): EditableColumnLayout[] {
  const targetLayout = columnLayouts[layoutIndex];

  if (targetLayout === undefined || targetLayout.minWidthPx === null) {
    return copyEditableColumnLayouts(columnLayouts);
  }

  return copyEditableColumnLayouts(
    columnLayouts.filter(
      (_layout, currentIndex) => currentIndex !== layoutIndex,
    ),
  );
}
