const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_COLUMNS = "16";
const DEFAULT_MOBILE_COLUMNS = "10";
const DEFAULT_GAP = "8";
const DEFAULT_INCLUDE_DARK_THEME = true;
const DEFAULT_PREVIEW_THEME = "light";
const DEFAULT_RESPONSIVE = false;

export type StackIconsPreviewTheme = "dark" | "light";

type EditorState = {
  icons: string;
  columns: string;
  mobileColumns: string;
  gap: string;
  includeDarkTheme: boolean;
  previewTheme: StackIconsPreviewTheme;
  responsive: boolean;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  columns: DEFAULT_COLUMNS,
  mobileColumns: DEFAULT_MOBILE_COLUMNS,
  gap: DEFAULT_GAP,
  includeDarkTheme: DEFAULT_INCLUDE_DARK_THEME,
  previewTheme: DEFAULT_PREVIEW_THEME,
  responsive: DEFAULT_RESPONSIVE,
};

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  const includeDarkTheme =
    getSearchParamValue(searchParams["include-dark-theme"]) ??
    getSearchParamValue(searchParams.includeDarkTheme);
  const responsive =
    getSearchParamValue(searchParams.responsive) ??
    getSearchParamValue(searchParams["include-responsive-sources"]);

  return {
    icons: getSearchParamValue(searchParams.icons) ?? DEFAULT_ICONS,
    columns: getSearchParamValue(searchParams.columns) ?? DEFAULT_COLUMNS,
    mobileColumns:
      getSearchParamValue(searchParams.mobileColumns) ??
      getSearchParamValue(searchParams["mobile-columns"]) ??
      DEFAULT_MOBILE_COLUMNS,
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
    includeDarkTheme: includeDarkTheme !== "false",
    previewTheme: getPreviewTheme(searchParams),
    responsive: responsive === "true",
  };
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
