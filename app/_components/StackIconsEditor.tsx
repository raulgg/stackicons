"use client";

import React from "react";
import { LinkIcon } from "lucide-react";

const DEFAULT_ICONS = "typescript,nextjs,tailwind,vercel";
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

function buildPageQuery(state: StackIconsEditorState): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", state.columns);
  params.set("gap", state.gap);

  return params.toString();
}

function buildIconsUrl(state: StackIconsEditorState, currentOrigin: string): string {
  if (currentOrigin === "") {
    return "";
  }

  const url = new URL("/icons", currentOrigin);

  url.searchParams.set("icons", state.icons.trim() === "" ? "all" : state.icons);
  url.searchParams.set("columns", state.columns);
  url.searchParams.set("gap", state.gap);

  return url.toString();
}

function subscribeToCurrentOrigin() {
  return () => {};
}

function getCurrentOrigin() {
  return window.location.origin;
}

function getServerOriginSnapshot() {
  return "";
}

type StackIconsEditorProps = {
  initialState: StackIconsEditorState;
};

export function StackIconsEditor({ initialState }: StackIconsEditorProps) {
  const currentOrigin = React.useSyncExternalStore(
    subscribeToCurrentOrigin,
    getCurrentOrigin,
    getServerOriginSnapshot,
  );
  const [state, setState] =
    React.useState<StackIconsEditorState>(initialState);

  const generatedUrl = buildIconsUrl(state, currentOrigin);

  function updateState<Field extends keyof StackIconsEditorState>(
    field: Field,
    value: StackIconsEditorState[Field],
  ) {
    const nextState = {
      ...state,
      [field]: value,
    };

    setState(nextState);

    const nextQuery = buildPageQuery(nextState);
    const nextUrl = `${window.location.pathname}?${nextQuery}`;

    window.history.replaceState(null, "", nextUrl);
  }

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <label
        className="font-mono text-sm font-medium text-card-foreground"
        htmlFor="icons"
      >
        Icon slugs
      </label>
      <textarea
        className="mt-3 min-h-40 w-full resize-none rounded-md border bg-background p-4 font-mono text-sm outline-none ring-ring transition focus:ring-2"
        id="icons"
        onChange={(event) => updateState("icons", event.target.value)}
        value={state.icons}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            className="font-mono text-xs text-muted-foreground"
            htmlFor="columns"
          >
            Columns
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
            id="columns"
            max={20}
            min={2}
            onChange={(event) => updateState("columns", event.target.value)}
            type="number"
            value={state.columns}
          />
        </div>
        <div>
          <label className="font-mono text-xs text-muted-foreground" htmlFor="gap">
            Gap
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none ring-ring transition focus:ring-2"
            id="gap"
            max={24}
            min={0}
            onChange={(event) => updateState("gap", event.target.value)}
            type="number"
            value={state.gap}
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
          htmlFor="generated-url"
        >
          <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          SVG URL
        </label>
        <input
          className="mt-1 w-full rounded-md border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground"
          id="generated-url"
          readOnly
          type="text"
          value={generatedUrl}
        />
      </div>
    </div>
  );
}
