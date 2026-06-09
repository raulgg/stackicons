import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  DEFAULT_SINGLE_COLUMN_LAYOUTS,
  getDefaultColumnLayouts,
  parseEditableColumnLayouts,
  type EditableColumnLayout,
  type LayoutMode,
} from "@/lib/icons/column-layout";

const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_GAP = "8";
const DEFAULT_PREVIEW_THEME = "light";

export type StackIconsPreviewTheme = "dark" | "light";
export type ColumnLayout = EditableColumnLayout;
export type { LayoutMode };

type EditorState = {
  icons: string;
  layoutMode: LayoutMode;
  columnLayouts: ColumnLayout[];
  gap: string;
  previewTheme: StackIconsPreviewTheme;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  layoutMode: "single",
  columnLayouts: DEFAULT_SINGLE_COLUMN_LAYOUTS,
  gap: DEFAULT_GAP,
  previewTheme: DEFAULT_PREVIEW_THEME,
};

export { DEFAULT_RESPONSIVE_COLUMN_LAYOUTS };

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
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
    previewTheme: getPreviewTheme(searchParams),
  };
}

export function buildStackIconsEditorPageQuery(
  state: StackIconsEditorState,
): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("layout", state.layoutMode);
  params.set("column-layouts", JSON.stringify(state.columnLayouts));
  params.set("gap", state.gap);
  params.set("preview-theme", state.previewTheme);

  return params.toString();
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
  if (layoutMode === null) {
    return null;
  }

  const rawColumnLayouts = getSearchParamValue(searchParams["column-layouts"]);

  if (rawColumnLayouts === undefined) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawColumnLayouts);

    return parseEditableColumnLayouts(parsed, layoutMode);
  } catch {
    return null;
  }
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
