"use client";

import React from "react";

import {
  copyEditableColumnLayouts,
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getEditableBaseColumnLayout,
} from "@/lib/icons/column-layout";
import {
  generateReadmeImage,
  type GeneratedImageSource,
} from "@/lib/icons/readme-image";

import {
  buildStackIconsEditorPageQuery,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  type ColumnLayout,
  type LayoutMode,
  type StackIconsEditorState,
} from "./state";

// Product default icon size emitted in every generated image source (ADR
// 0001). It deliberately differs from the endpoint's back-compat default of
// 40. The icon size slider is a separate issue; until it lands the README
// image editor always emits this constant.
const DEFAULT_ICON_SIZE = "48";

type CopyGeneratedHtmlStatus = "failed" | "idle" | "succeeded";
type CopyImageUrlStatus = "failed" | "idle" | "succeeded";
type CopyGeneratedHtmlState = {
  signature: string;
  status: CopyGeneratedHtmlStatus;
};
type CopyImageUrlState = {
  signature: string;
  statusByKey: Record<string, CopyImageUrlStatus>;
};
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
  const [copyGeneratedHtmlState, setCopyGeneratedHtmlState] =
    React.useState<CopyGeneratedHtmlState>({
      signature: "",
      status: "idle",
    });
  const [copyImageUrlState, setCopyImageUrlState] =
    React.useState<CopyImageUrlState>({
      signature: "",
      statusByKey: {},
    });
  const [layoutMemory, setLayoutMemory] = React.useState<LayoutMemoryState>(
    () => buildInitialLayoutMemory(initialState),
  );
  const generatedReadmeImageResult = generateReadmeImage({
    columnLayouts: editorState.columnLayouts,
    currentOrigin,
    gap: editorState.gap,
    icons: editorState.icons,
    includeDarkTheme: true,
    layoutMode: editorState.layoutMode,
    size: DEFAULT_ICON_SIZE,
  });
  const generatedReadmeImage = generatedReadmeImageResult.success
    ? generatedReadmeImageResult
    : null;
  const generatedHtml = generatedReadmeImage?.readmeHtml ?? "";
  const generatedImageSources = generatedReadmeImage?.imageSources ?? [];
  const unknownSlugs = generatedReadmeImage?.unknownSlugs ?? [];
  const hasGeneratedOutput = generatedReadmeImage !== null;
  const validationErrors = generatedReadmeImageResult.success
    ? []
    : generatedReadmeImageResult.errors;
  const generatedOutputSignature = JSON.stringify({
    generatedHtml,
    generatedImageSources,
    validationErrors,
  });
  const copyGeneratedHtmlStatus =
    copyGeneratedHtmlState.signature === generatedOutputSignature
      ? copyGeneratedHtmlState.status
      : "idle";
  const copyImageUrlStatusByKey =
    copyImageUrlState.signature === generatedOutputSignature
      ? copyImageUrlState.statusByKey
      : {};

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

  async function copyGeneratedHtml() {
    const copyGeneratedOutputSignature = generatedOutputSignature;
    const clipboard = navigator.clipboard;

    if (generatedHtml === "" || clipboard === undefined) {
      setCopyGeneratedHtmlState({
        signature: copyGeneratedOutputSignature,
        status: "failed",
      });
      return;
    }

    try {
      await clipboard.writeText(generatedHtml);
      setCopyGeneratedHtmlState({
        signature: copyGeneratedOutputSignature,
        status: "succeeded",
      });
    } catch {
      setCopyGeneratedHtmlState({
        signature: copyGeneratedOutputSignature,
        status: "failed",
      });
    }
  }

  async function copyImageUrl(source: GeneratedImageSource) {
    const sourceKey = getGeneratedImageSourceKey(source);
    const copyGeneratedOutputSignature = generatedOutputSignature;
    const clipboard = navigator.clipboard;

    if (clipboard === undefined) {
      setCopyImageUrlState((currentState) => ({
        signature: copyGeneratedOutputSignature,
        statusByKey: {
          ...(currentState.signature === copyGeneratedOutputSignature
            ? currentState.statusByKey
            : {}),
          [sourceKey]: "failed",
        },
      }));
      return;
    }

    try {
      await clipboard.writeText(source.url);
      setCopyImageUrlState((currentState) => ({
        signature: copyGeneratedOutputSignature,
        statusByKey: {
          ...(currentState.signature === copyGeneratedOutputSignature
            ? currentState.statusByKey
            : {}),
          [sourceKey]: "succeeded",
        },
      }));
    } catch {
      setCopyImageUrlState((currentState) => ({
        signature: copyGeneratedOutputSignature,
        statusByKey: {
          ...(currentState.signature === copyGeneratedOutputSignature
            ? currentState.statusByKey
            : {}),
          [sourceKey]: "failed",
        },
      }));
    }
  }

  return {
    addBreakpointLayout,
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    copyImageUrl,
    copyImageUrlStatusByKey,
    generatedHtml,
    generatedImageSources,
    hasGeneratedOutput,
    removeBreakpointLayout,
    state: editorState,
    switchLayoutMode,
    unknownSlugs,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  };
}

function getGeneratedImageSourceKey(source: GeneratedImageSource): string {
  return `${source.minWidthPx ?? "default"}:${source.theme}`;
}
