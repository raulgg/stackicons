"use client";

import React from "react";

import { parseIconRequest } from "@/lib/icons/parse-request";
import { escapeXml } from "@/lib/utils";

import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  type ColumnLayout,
  type LayoutMode,
  type StackIconsEditorState,
} from "./state";

type CopyGeneratedHtmlStatus = "failed" | "idle" | "succeeded";
type LayoutMemoryState = {
  singleColumnLayout: ColumnLayout;
  responsiveColumnLayouts: ColumnLayout[];
};
type ParsedColumnLayout = { columns: number; minWidthPx: number | null };

function getBaseColumnLayout(state: StackIconsEditorState) {
  return (
    state.columnLayouts.find((layout) => layout.minWidthPx === null) ??
    state.columnLayouts[0]
  );
}

function buildPageQuery(state: StackIconsEditorState): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("layout", state.layoutMode);
  params.set("column-layouts", JSON.stringify(state.columnLayouts));
  params.set("gap", state.gap);
  params.set("include-dark-theme", String(state.includeDarkTheme));
  params.set("preview-theme", state.previewTheme);

  return params.toString();
}

function buildInitialLayoutMemory(
  initialState: StackIconsEditorState,
): LayoutMemoryState {
  return {
    singleColumnLayout:
      initialState.layoutMode === "single"
        ? { ...getBaseColumnLayout(initialState) }
        : { ...getBaseColumnLayout(DEFAULT_STACK_ICONS_EDITOR_STATE) },
    responsiveColumnLayouts:
      initialState.layoutMode === "responsive"
        ? initialState.columnLayouts.map((layout) => ({ ...layout }))
        : DEFAULT_RESPONSIVE_COLUMN_LAYOUTS.map((layout) => ({ ...layout })),
  };
}

function buildIconRequestParams(
  state: StackIconsEditorState,
  columns = getBaseColumnLayout(state).columns,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", columns);
  params.set("gap", state.gap);

  return params;
}

function isAllIconState(state: StackIconsEditorState): boolean {
  const rawIcons = state.icons.trim();

  return rawIcons === "all";
}

function buildIconsUrl(
  state: StackIconsEditorState,
  currentOrigin: string,
): string {
  if (currentOrigin === "") {
    return "";
  }

  const url = new URL("/icons", currentOrigin);
  url.search = buildIconRequestParams(state).toString();
  url.searchParams.set("theme", state.previewTheme);

  return url.toString();
}

function buildReadmeImageUrl(
  state: StackIconsEditorState,
  currentOrigin: string,
  theme: "dark" | "light",
  columns = getBaseColumnLayout(state).columns,
): string {
  if (currentOrigin === "") {
    return "";
  }

  const url = new URL("/icons", currentOrigin);
  const params = new URLSearchParams();

  if (!isAllIconState(state)) {
    params.set("icons", state.icons);
  }

  params.set("columns", columns);
  params.set("gap", state.gap);
  params.set("theme", theme);

  url.search = params.toString();

  return url.toString();
}

function buildReadmeHtml(
  state: StackIconsEditorState,
  currentOrigin: string,
): string {
  const parsedRequest = parseIconRequest(buildIconRequestParams(state));

  if (!parsedRequest.success) {
    return "";
  }

  const fallbackUrl = buildReadmeImageUrl(state, currentOrigin, "light");

  if (fallbackUrl === "") {
    return "";
  }

  const labels = isAllIconState(state)
    ? "All stack icons"
    : parsedRequest.data.icons.map((icon) => icon.label).join(", ");
  const sources: string[] = [];
  const breakpointLayouts = state.columnLayouts
    .filter(
      (layout): layout is ColumnLayout & { minWidthPx: string } =>
        layout.minWidthPx !== null,
    )
    .sort((a, b) => Number(b.minWidthPx) - Number(a.minWidthPx));

  for (const layout of breakpointLayouts) {
    const media = `(min-width: ${layout.minWidthPx}px)`;

    if (state.includeDarkTheme) {
      const darkSourceUrl = buildReadmeImageUrl(
        state,
        currentOrigin,
        "dark",
        layout.columns,
      );

      sources.push(
        `  <source media="${media} and (prefers-color-scheme: dark)" srcset="${escapeXml(darkSourceUrl)}" />`,
      );
    }

    const lightSourceUrl = buildReadmeImageUrl(
      state,
      currentOrigin,
      "light",
      layout.columns,
    );

    sources.push(
      `  <source media="${media}" srcset="${escapeXml(lightSourceUrl)}" />`,
    );
  }

  if (state.includeDarkTheme) {
    const darkFallbackUrl = buildReadmeImageUrl(state, currentOrigin, "dark");

    sources.push(
      `  <source media="(prefers-color-scheme: dark)" srcset="${escapeXml(darkFallbackUrl)}" />`,
    );
  }

  const sourceMarkup = sources.length === 0 ? "" : `${sources.join("\n")}\n`;

  return `<picture>
${sourceMarkup}  <img src="${escapeXml(fallbackUrl)}" alt="${escapeXml(labels)}" title="${escapeXml(labels)}" width="100%" />
</picture>`;
}

function validateColumnLayouts(state: StackIconsEditorState): string[] {
  const errors: string[] = [];
  const parsedLayouts = state.columnLayouts.map(parseColumnLayout);
  const baseLayoutCount = parsedLayouts.filter(
    (layout) => layout.minWidthPx === null,
  ).length;
  const breakpointLayouts = parsedLayouts.filter(
    (layout): layout is ParsedColumnLayout & { minWidthPx: number } =>
      layout.minWidthPx !== null,
  );

  if (state.columnLayouts.length === 0) {
    errors.push("At least one column layout is required.");
  }

  if (baseLayoutCount !== 1) {
    errors.push("Exactly one base column layout is required.");
  }

  if (
    parsedLayouts.some(
      (layout) =>
        !Number.isInteger(layout.columns) ||
        layout.columns < 2 ||
        layout.columns > 20,
    )
  ) {
    errors.push("Each column layout must use 2 to 20 columns.");
  }

  if (
    breakpointLayouts.some(
      (layout) =>
        !Number.isInteger(layout.minWidthPx) ||
        layout.minWidthPx < 1 ||
        layout.minWidthPx > 3840,
    )
  ) {
    errors.push("Breakpoint min width must be an integer from 1 to 3840.");
  }

  if (
    new Set(breakpointLayouts.map((layout) => layout.minWidthPx)).size !==
    breakpointLayouts.length
  ) {
    errors.push("Breakpoint min width values must be unique.");
  }

  if (state.layoutMode === "single") {
    if (
      state.columnLayouts.length !== 1 ||
      parsedLayouts[0]?.minWidthPx !== null
    ) {
      errors.push("Single layout mode must have exactly one base layout.");
    }
  } else if (state.columnLayouts.length < 2 || breakpointLayouts.length === 0) {
    errors.push(
      "Responsive layout mode must have a base layout and at least one breakpoint layout.",
    );
  }

  return errors;
}

function normalizeColumnLayouts(columnLayouts: ColumnLayout[]): ColumnLayout[] {
  const baseLayout = columnLayouts.find((layout) => layout.minWidthPx === null);
  const breakpointLayouts = columnLayouts
    .filter(
      (layout): layout is ColumnLayout & { minWidthPx: string } =>
        layout.minWidthPx !== null,
    )
    .sort(compareBreakpointLayouts);

  return baseLayout === undefined
    ? columnLayouts
    : [baseLayout, ...breakpointLayouts];
}

function normalizeColumnLayoutsWhenBreakpointsAreValid(
  columnLayouts: ColumnLayout[],
): ColumnLayout[] {
  const breakpointLayouts = columnLayouts.filter(
    (layout): layout is ColumnLayout & { minWidthPx: string } =>
      layout.minWidthPx !== null,
  );
  const hasInvalidBreakpoint = breakpointLayouts.some(
    (layout) => getValidBreakpointMinWidth(layout.minWidthPx) === null,
  );

  return hasInvalidBreakpoint
    ? columnLayouts
    : normalizeColumnLayouts(columnLayouts);
}

function updateLayoutMemory(
  layoutMemory: LayoutMemoryState,
  state: StackIconsEditorState,
): LayoutMemoryState {
  if (state.layoutMode === "single") {
    return {
      ...layoutMemory,
      singleColumnLayout: { ...getBaseColumnLayout(state) },
    };
  }

  return {
    ...layoutMemory,
    responsiveColumnLayouts: normalizeColumnLayoutsWhenBreakpointsAreValid(
      state.columnLayouts,
    ).map((layout) => ({
      ...layout,
    })),
  };
}

function parseColumnLayout(layout: ColumnLayout): ParsedColumnLayout {
  return {
    columns: Number(layout.columns),
    minWidthPx: layout.minWidthPx === null ? null : Number(layout.minWidthPx),
  };
}

function compareBreakpointLayouts(
  a: ColumnLayout & { minWidthPx: string },
  b: ColumnLayout & { minWidthPx: string },
) {
  const aMinWidth = getValidBreakpointMinWidth(a.minWidthPx);
  const bMinWidth = getValidBreakpointMinWidth(b.minWidthPx);

  if (aMinWidth !== null && bMinWidth !== null) {
    return aMinWidth - bMinWidth;
  }

  if (aMinWidth !== null) {
    return -1;
  }

  if (bMinWidth !== null) {
    return 1;
  }

  return 0;
}

function getValidBreakpointMinWidth(minWidthPx: string): number | null {
  if (minWidthPx.trim() !== minWidthPx || minWidthPx === "") {
    return null;
  }

  const parsedMinWidth = Number(minWidthPx);

  return Number.isInteger(parsedMinWidth) &&
    parsedMinWidth >= 1 &&
    parsedMinWidth <= 3840
    ? parsedMinWidth
    : null;
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

export function useStackIconsEditorForm(initialState: StackIconsEditorState) {
  const currentOrigin = React.useSyncExternalStore(
    subscribeToCurrentOrigin,
    getCurrentOrigin,
    getServerOriginSnapshot,
  );
  const [editorState, setEditorState] =
    React.useState<StackIconsEditorState>(initialState);
  const [previewState, setPreviewState] =
    React.useState<StackIconsEditorState | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [copyGeneratedHtmlStatus, setCopyGeneratedHtmlStatus] =
    React.useState<CopyGeneratedHtmlStatus>("idle");
  const [layoutMemory, setLayoutMemory] = React.useState<LayoutMemoryState>(
    () => buildInitialLayoutMemory(initialState),
  );
  const previewGenerationId = React.useRef(0);

  const generatedUrl =
    previewState === null ? "" : buildIconsUrl(previewState, currentOrigin);
  const generatedHtml =
    previewState === null ? "" : buildReadmeHtml(previewState, currentOrigin);

  function commitEditorState(nextState: StackIconsEditorState) {
    setEditorState(nextState);
    setLayoutMemory((currentLayoutMemory) =>
      updateLayoutMemory(currentLayoutMemory, nextState),
    );

    const nextQuery = buildPageQuery(nextState);
    const nextUrl = `${window.location.pathname}?${nextQuery}`;

    window.history.replaceState(null, "", nextUrl);
  }

  function updateField<Field extends keyof StackIconsEditorState>(
    field: Field,
    value: StackIconsEditorState[Field],
  ) {
    const nextState = {
      ...editorState,
      [field]: value,
    };

    setEditorState(nextState);

    const nextQuery = buildPageQuery(nextState);
    const nextUrl = `${window.location.pathname}?${nextQuery}`;

    window.history.replaceState(null, "", nextUrl);

    if (field === "previewTheme") {
      setPreviewState((currentPreviewState) =>
        currentPreviewState === null
          ? null
          : {
              ...currentPreviewState,
              previewTheme: value as StackIconsEditorState["previewTheme"],
            },
      );
    }
  }

  function updateBaseColumns(columns: string) {
    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: normalizeColumnLayoutsWhenBreakpointsAreValid(
        editorState.columnLayouts.map((layout) =>
          layout.minWidthPx === null ? { ...layout, columns } : layout,
        ),
      ),
    };

    commitEditorState(nextState);
  }

  function updateColumnLayout(
    layoutIndex: number,
    field: keyof ColumnLayout,
    value: string,
  ) {
    const targetLayout = editorState.columnLayouts[layoutIndex];

    if (targetLayout === undefined) {
      return;
    }

    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: normalizeColumnLayoutsWhenBreakpointsAreValid(
        editorState.columnLayouts.map((layout, currentIndex) =>
          currentIndex === layoutIndex ? { ...layout, [field]: value } : layout,
        ),
      ),
    };

    commitEditorState(nextState);
  }

  function switchLayoutMode(layoutMode: LayoutMode) {
    if (layoutMode === editorState.layoutMode) {
      return;
    }

    const nextMemory: LayoutMemoryState = {
      singleColumnLayout:
        editorState.layoutMode === "single"
          ? { ...getBaseColumnLayout(editorState) }
          : layoutMemory.singleColumnLayout,
      responsiveColumnLayouts:
        editorState.layoutMode === "responsive"
          ? editorState.columnLayouts.map((layout) => ({ ...layout }))
          : layoutMemory.responsiveColumnLayouts,
    };
    const nextColumnLayouts =
      layoutMode === "single"
        ? [{ ...nextMemory.singleColumnLayout }]
        : nextMemory.responsiveColumnLayouts.map((layout) => ({ ...layout }));
    const nextState: StackIconsEditorState = {
      ...editorState,
      layoutMode,
      columnLayouts: nextColumnLayouts,
    };

    setLayoutMemory(nextMemory);
    setEditorState(nextState);

    const nextQuery = buildPageQuery(nextState);
    const nextUrl = `${window.location.pathname}?${nextQuery}`;

    window.history.replaceState(null, "", nextUrl);
  }

  function generatePreview() {
    previewGenerationId.current += 1;

    const parsedRequest = parseIconRequest(
      buildIconRequestParams(
        editorState,
        editorState.columnLayouts[0]?.columns ?? "",
      ),
    );
    const columnLayoutErrors = validateColumnLayouts(editorState);

    if (!parsedRequest.success || columnLayoutErrors.length > 0) {
      setPreviewState(null);
      setValidationErrors([
        ...(!parsedRequest.success ? parsedRequest.errors : []),
        ...columnLayoutErrors,
      ]);
      setCopyGeneratedHtmlStatus("idle");
      return;
    }

    setPreviewState({
      ...editorState,
      columnLayouts: normalizeColumnLayouts(editorState.columnLayouts),
    });
    setValidationErrors([]);
    setCopyGeneratedHtmlStatus("idle");
  }

  async function copyGeneratedHtml() {
    const copyPreviewGenerationId = previewGenerationId.current;
    const clipboard = navigator.clipboard;

    if (generatedHtml === "" || clipboard === undefined) {
      setCopyGeneratedHtmlStatus("failed");
      return;
    }

    try {
      await clipboard.writeText(generatedHtml);
      if (copyPreviewGenerationId !== previewGenerationId.current) {
        return;
      }
      setCopyGeneratedHtmlStatus("succeeded");
    } catch {
      if (copyPreviewGenerationId !== previewGenerationId.current) {
        return;
      }
      setCopyGeneratedHtmlStatus("failed");
    }
  }

  return {
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    generatePreview,
    generatedHtml,
    generatedUrl,
    state: editorState,
    switchLayoutMode,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  };
}
