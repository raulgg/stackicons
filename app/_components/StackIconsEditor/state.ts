const DEFAULT_ICONS = "typescript,nextjs,tailwindcss,vercel";
const DEFAULT_COLUMNS = "16";
const DEFAULT_GAP = "8";

type EditorState = {
  icons: string;
  columns: string;
  gap: string;
};

export type StackIconsEditorState = EditorState;

export const DEFAULT_STACK_ICONS_EDITOR_STATE: StackIconsEditorState = {
  icons: DEFAULT_ICONS,
  columns: DEFAULT_COLUMNS,
  gap: DEFAULT_GAP,
};

type SearchParamValue = string | string[] | undefined;

export function getStackIconsEditorInitialState(
  searchParams: Record<string, SearchParamValue>,
): StackIconsEditorState {
  return {
    icons: getSearchParamValue(searchParams.icons) ?? DEFAULT_ICONS,
    columns: getSearchParamValue(searchParams.columns) ?? DEFAULT_COLUMNS,
    gap: getSearchParamValue(searchParams.gap) ?? DEFAULT_GAP,
  };
}

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
