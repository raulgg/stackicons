"use client";

import React from "react";

import {
  copyEditableColumnLayouts,
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getEditableBaseColumnLayout,
  validateColumnLayouts,
} from "@/lib/icons/column-layout";
import { parseIconRequest } from "@/lib/icons/parse-request";
import { buildReadmeEmbedHtml } from "@/lib/icons/readme-embed";

import {
  buildStackIconsEditorPageQuery,
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

function getBaseColumnLayout(state: StackIconsEditorState) {
  return getEditableBaseColumnLayout(state.columnLayouts);
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
        ? copyEditableColumnLayouts(initialState.columnLayouts)
        : copyEditableColumnLayouts(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS),
  };
}

function buildIconRequestParams(
  state: StackIconsEditorState,
  columns: number | string = getBaseColumnLayout(state).columns,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", String(columns));
  params.set("gap", state.gap);

  return params;
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

function buildReadmeHtml(
  state: StackIconsEditorState,
  currentOrigin: string,
): string {
  return buildReadmeEmbedHtml({
    columnLayouts: state.columnLayouts,
    currentOrigin,
    gap: state.gap,
    icons: state.icons,
    includeDarkTheme: state.includeDarkTheme,
    layoutMode: state.layoutMode,
  });
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
    responsiveColumnLayouts: copyEditableColumnLayouts(state.columnLayouts),
  };
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

function replaceEditorUrl(state: StackIconsEditorState) {
  const nextQuery = buildStackIconsEditorPageQuery(state);
  const nextUrl = `${window.location.pathname}?${nextQuery}`;

  window.history.replaceState(null, "", nextUrl);
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

    replaceEditorUrl(nextState);
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
    replaceEditorUrl(nextState);

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
      columnLayouts: editorState.columnLayouts.map((layout) =>
        layout.minWidthPx === null ? { ...layout, columns } : layout,
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
      columnLayouts: editorState.columnLayouts.map((layout, currentIndex) =>
        currentIndex === layoutIndex ? { ...layout, [field]: value } : layout,
      ),
    };

    commitEditorState(nextState);
  }

  function addBreakpointLayout() {
    if (editorState.layoutMode !== "responsive") {
      return;
    }

    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: [
        ...editorState.columnLayouts,
        { columns: "", minWidthPx: "" },
      ],
    };

    commitEditorState(nextState);
  }

  function removeBreakpointLayout(layoutIndex: number) {
    if (editorState.layoutMode !== "responsive") {
      return;
    }

    const targetLayout = editorState.columnLayouts[layoutIndex];
    const breakpointLayoutCount = editorState.columnLayouts.filter(
      (layout) => layout.minWidthPx !== null,
    ).length;

    if (
      targetLayout === undefined ||
      targetLayout.minWidthPx === null ||
      breakpointLayoutCount <= 1
    ) {
      return;
    }

    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: editorState.columnLayouts.filter(
        (_layout, currentIndex) => currentIndex !== layoutIndex,
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
    replaceEditorUrl(nextState);
  }

  function generatePreview() {
    previewGenerationId.current += 1;

    const parsedRequest = parseIconRequest(
      buildIconRequestParams(
        editorState,
        getBaseColumnLayout(editorState).columns,
      ),
    );
    const columnLayoutResult = validateColumnLayouts({
      columnLayouts: editorState.columnLayouts,
      layoutMode: editorState.layoutMode,
    });

    if (!parsedRequest.success || !columnLayoutResult.success) {
      setPreviewState(null);
      setValidationErrors([
        ...(!parsedRequest.success ? parsedRequest.errors : []),
        ...(!columnLayoutResult.success ? columnLayoutResult.errors : []),
      ]);
      setCopyGeneratedHtmlStatus("idle");
      return;
    }

    setPreviewState(editorState);
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
    addBreakpointLayout,
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    generatePreview,
    generatedHtml,
    generatedUrl,
    removeBreakpointLayout,
    state: editorState,
    switchLayoutMode,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  };
}
