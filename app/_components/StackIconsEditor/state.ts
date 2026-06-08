const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_COLUMNS = "18";
const DEFAULT_GAP = "8";
const DEFAULT_INCLUDE_DARK_THEME = true;
const DEFAULT_PREVIEW_THEME = "light";

export type StackIconsPreviewTheme = "dark" | "light";
export type ColumnLayout = { columns: string; minWidthPx: string | null };
export type LayoutMode = "single" | "responsive";

type EditorState = {
  icons: string;
  layoutMode: LayoutMode;
  columnLayouts: ColumnLayout[];
  gap: string;
  includeDarkTheme: boolean;
  previewTheme: StackIconsPreviewTheme;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  layoutMode: "single",
  columnLayouts: [{ columns: DEFAULT_COLUMNS, minWidthPx: null }],
  gap: DEFAULT_GAP,
  includeDarkTheme: DEFAULT_INCLUDE_DARK_THEME,
  previewTheme: DEFAULT_PREVIEW_THEME,
};

export const DEFAULT_RESPONSIVE_COLUMN_LAYOUTS: ColumnLayout[] = [
  { columns: "12", minWidthPx: null },
  { columns: DEFAULT_COLUMNS, minWidthPx: "768" },
];

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  const includeDarkTheme =
    getSearchParamValue(searchParams["include-dark-theme"]) ??
    getSearchParamValue(searchParams.includeDarkTheme);
  const layoutMode = getLayoutMode(searchParams);
  const columnLayouts = getColumnLayouts(searchParams, layoutMode);
  const shouldUseDefaultLayout = layoutMode === null || columnLayouts === null;
  const activeLayoutMode = shouldUseDefaultLayout ? "single" : layoutMode;

  return {
    icons: getSearchParamValue(searchParams.icons) ?? DEFAULT_ICONS,
    layoutMode: activeLayoutMode,
    columnLayouts: shouldUseDefaultLayout
      ? DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts
      : (columnLayouts ?? getDefaultColumnLayouts(activeLayoutMode)),
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
    includeDarkTheme: includeDarkTheme !== "false",
    previewTheme: getPreviewTheme(searchParams),
  };
}

function getDefaultColumnLayouts(layoutMode: LayoutMode): ColumnLayout[] {
  return layoutMode === "responsive"
    ? DEFAULT_RESPONSIVE_COLUMN_LAYOUTS
    : DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts;
}

function getLayoutMode(
  searchParams: Record<string, SearchParamValue>,
): LayoutMode | null {
  const layoutMode = getSearchParamValue(searchParams.layout);

  if (layoutMode === undefined || layoutMode === "single") {
    return "single";
  }

  if (layoutMode === "responsive") {
    return "responsive";
  }

  return null;
}

function getColumnLayouts(
  searchParams: Record<string, SearchParamValue>,
  layoutMode: LayoutMode | null,
): ColumnLayout[] | null | undefined {
  const rawColumnLayouts = getSearchParamValue(searchParams["column-layouts"]);

  if (rawColumnLayouts === undefined) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawColumnLayouts);

    if (!Array.isArray(parsed)) {
      return null;
    }

    if (layoutMode === "responsive") {
      return getValidResponsiveColumnLayouts(parsed);
    }

    return getValidSingleColumnLayouts(parsed);
  } catch {
    return null;
  }
}

function getValidSingleColumnLayouts(parsed: unknown[]): ColumnLayout[] | null {
  if (
    parsed.length !== 1 ||
    !isColumnLayout(parsed[0]) ||
    parsed[0].minWidthPx !== null
  ) {
    return null;
  }

  return parsed as ColumnLayout[];
}

function getValidResponsiveColumnLayouts(
  parsed: unknown[],
): ColumnLayout[] | null {
  if (parsed.length < 2) {
    return null;
  }

  const baseLayouts = parsed.filter(
    (layout): layout is ColumnLayout =>
      isColumnLayout(layout) && layout.minWidthPx === null,
  );
  const breakpointLayouts = parsed.filter(
    (layout): layout is ColumnLayout & { minWidthPx: string } =>
      isColumnLayout(layout) && layout.minWidthPx !== null,
  );

  if (baseLayouts.length !== 1 || breakpointLayouts.length === 0) {
    return null;
  }

  if (breakpointLayouts.length !== parsed.length - baseLayouts.length) {
    return null;
  }

  return [
    baseLayouts[0],
    ...breakpointLayouts.sort(compareEditableBreakpointLayouts),
  ];
}

function compareEditableBreakpointLayouts(
  a: ColumnLayout & { minWidthPx: string },
  b: ColumnLayout & { minWidthPx: string },
) {
  const aMinWidth = getValidBreakpointPx(a.minWidthPx);
  const bMinWidth = getValidBreakpointPx(b.minWidthPx);

  if (aMinWidth !== null && bMinWidth !== null) {
    return aMinWidth - bMinWidth;
  }

  return 0;
}

function isColumnLayout(value: unknown): value is ColumnLayout {
  return (
    typeof value === "object" &&
    value !== null &&
    "columns" in value &&
    isValidColumns(value.columns) &&
    "minWidthPx" in value &&
    (value.minWidthPx === null || typeof value.minWidthPx === "string")
  );
}

function isValidColumns(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const columns = Number(value);

  return Number.isInteger(columns) && columns >= 2 && columns <= 20;
}

function getValidBreakpointPx(value: string): number | null {
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

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getPreviewTheme(
  searchParams: Record<string, SearchParamValue>,
): StackIconsPreviewTheme {
  const previewTheme =
    getSearchParamValue(searchParams["preview-theme"]) ??
    getSearchParamValue(searchParams.previewTheme);

  return previewTheme === "dark" ? "dark" : DEFAULT_PREVIEW_THEME;
}
