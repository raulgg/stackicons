const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_COLUMNS = "16";
const DEFAULT_GAP = "8";
const DEFAULT_INCLUDE_DARK_THEME = true;

type EditorState = {
  icons: string;
  columns: string;
  gap: string;
  includeDarkTheme: boolean;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  columns: DEFAULT_COLUMNS,
  gap: DEFAULT_GAP,
  includeDarkTheme: DEFAULT_INCLUDE_DARK_THEME,
};

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  const includeDarkTheme =
    getSearchParamValue(searchParams["include-dark-theme"]) ??
    getSearchParamValue(searchParams.includeDarkTheme);

  return {
    icons: getSearchParamValue(searchParams.icons) ?? DEFAULT_ICONS,
    columns: getSearchParamValue(searchParams.columns) ?? DEFAULT_COLUMNS,
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
    includeDarkTheme: includeDarkTheme !== "false",
  };
}

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
