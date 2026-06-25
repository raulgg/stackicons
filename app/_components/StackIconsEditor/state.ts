import {
  DEFAULT_COLUMN_LAYOUTS,
  parseEditableColumnLayouts,
  type EditableColumnLayout,
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

type EditorState = {
  icons: string;
  columnLayouts: EditableColumnLayout[];
  iconSize: string;
  gap: string;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  columnLayouts: DEFAULT_COLUMN_LAYOUTS,
  iconSize: DEFAULT_ICON_SIZE,
  gap: DEFAULT_GAP,
};

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  const columnLayouts = getColumnLayouts(searchParams);

  return {
    icons: getSearchParamValue(searchParams.s) ?? DEFAULT_ICONS,
    columnLayouts: columnLayouts ?? DEFAULT_COLUMN_LAYOUTS,
    iconSize: getIconSize(searchParams),
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
  };
}

export function buildStackIconsEditorPageQuery(
  state: StackIconsEditorState,
): string {
  const params = new URLSearchParams();

  params.set("s", state.icons);
  params.set("column-layouts", JSON.stringify(state.columnLayouts));
  params.set("size", state.iconSize);
  params.set("gap", state.gap);

  return params.toString();
}

function getColumnLayouts(
  searchParams: Record<string, SearchParamValue>,
): EditableColumnLayout[] | null | undefined {
  const raw = getSearchParamValue(searchParams["column-layouts"]);
  if (raw === undefined) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    return parseEditableColumnLayouts(parsed);
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
