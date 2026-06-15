import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getDefaultColumnLayouts,
  parseEditableColumnLayouts,
  type EditableColumnLayout,
  type LayoutMode,
} from "@/lib/icons/column-layout";

const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_GAP = "8";

// Product default icon size emitted in every generated image source (ADR
// 0001). It deliberately differs from the endpoint's back-compat default of
// 40.
export const DEFAULT_ICON_SIZE = "48";
export const MIN_ICON_SIZE = 24;
export const MAX_ICON_SIZE = 64;
export const ICON_SIZE_STEP = 2;

export type StackIconsPreviewTheme = "dark" | "light";
export type { LayoutMode };

type EditorState = {
  icons: string;
  layoutMode: LayoutMode;
  columnLayouts: EditableColumnLayout[];
  iconSize: string;
  gap: string;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  layoutMode: "responsive",
  columnLayouts: DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  iconSize: DEFAULT_ICON_SIZE,
  gap: DEFAULT_GAP,
};

export { DEFAULT_RESPONSIVE_COLUMN_LAYOUTS };

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  const layoutMode = getLayoutMode(searchParams);
  const activeLayoutMode = layoutMode ?? "responsive";
  const columnLayouts =
    layoutMode === null ? null : getColumnLayouts(searchParams, layoutMode);

  return {
    icons: getSearchParamValue(searchParams.icons) ?? DEFAULT_ICONS,
    layoutMode: activeLayoutMode,
    columnLayouts: columnLayouts ?? getDefaultColumnLayouts(activeLayoutMode),
    iconSize: getIconSize(searchParams),
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
  };
}

export function buildStackIconsEditorPageQuery(
  state: StackIconsEditorState,
): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("layout", state.layoutMode);
  params.set("column-layouts", JSON.stringify(state.columnLayouts));
  params.set("size", state.iconSize);
  params.set("gap", state.gap);

  return params.toString();
}

function getLayoutMode(
  searchParams: Record<string, SearchParamValue>,
): LayoutMode | null {
  const layoutMode = getSearchParamValue(searchParams.layout);

  if (layoutMode === undefined || layoutMode === "responsive") {
    return "responsive";
  }

  if (layoutMode === "single") {
    return "single";
  }

  return null;
}

function getColumnLayouts(
  searchParams: Record<string, SearchParamValue>,
  layoutMode: LayoutMode | null,
): EditableColumnLayout[] | null | undefined {
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

// Shared URLs can carry any `size` value, so the icon size is validated on
// parse: integers clamp into the slider range (snapped to its step) and
// anything else falls back to the default icon size.
function getIconSize(searchParams: Record<string, SearchParamValue>): string {
  const rawIconSize = getSearchParamValue(searchParams.size);

  if (rawIconSize === undefined) {
    return DEFAULT_ICON_SIZE;
  }

  const iconSize = Number(rawIconSize);

  if (
    rawIconSize.trim() !== rawIconSize ||
    rawIconSize === "" ||
    !Number.isInteger(iconSize)
  ) {
    return DEFAULT_ICON_SIZE;
  }

  const clampedIconSize = Math.min(
    Math.max(iconSize, MIN_ICON_SIZE),
    MAX_ICON_SIZE,
  );
  const snappedIconSize =
    MIN_ICON_SIZE +
    Math.round((clampedIconSize - MIN_ICON_SIZE) / ICON_SIZE_STEP) *
      ICON_SIZE_STEP;

  return String(Math.min(snappedIconSize, MAX_ICON_SIZE));
}

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
