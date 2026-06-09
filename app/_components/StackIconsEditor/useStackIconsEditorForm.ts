"use client";

import React from "react";

import {
  copyEditableColumnLayouts,
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getEditableBaseColumnLayout,
} from "@/lib/icons/column-layout";
import {
  generateReadmeImage,
  type ReadmeImageGenerationResult,
} from "@/lib/icons/readme-image";

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
type GeneratedReadmeImage = Extract<
  ReadmeImageGenerationResult,
  { success: true }
>;

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

function getDisplayedSvgUrl({
  generatedReadmeImage,
  previewTheme,
}: {
  generatedReadmeImage: GeneratedReadmeImage | null;
  previewTheme: StackIconsEditorState["previewTheme"];
}): string {
  if (generatedReadmeImage === null) {
    return "";
  }

  const themedBaseSource = generatedReadmeImage.imageSources.find(
    (source) => source.minWidthPx === null && source.theme === previewTheme,
  );
  const lightBaseSource = generatedReadmeImage.imageSources.find(
    (source) => source.minWidthPx === null && source.theme === "light",
  );

  return themedBaseSource?.url ?? lightBaseSource?.url ?? "";
}

export function useStackIconsEditorForm(initialState: StackIconsEditorState) {
  const currentOrigin = React.useSyncExternalStore(
    subscribeToCurrentOrigin,
    getCurrentOrigin,
    getServerOriginSnapshot,
  );
  const [editorState, setEditorState] =
    React.useState<StackIconsEditorState>(initialState);
  const [generatedReadmeImage, setGeneratedReadmeImage] =
    React.useState<GeneratedReadmeImage | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [copyGeneratedHtmlStatus, setCopyGeneratedHtmlStatus] =
    React.useState<CopyGeneratedHtmlStatus>("idle");
  const [layoutMemory, setLayoutMemory] = React.useState<LayoutMemoryState>(
    () => buildInitialLayoutMemory(initialState),
  );
  const previewGenerationId = React.useRef(0);

  const generatedUrl = getDisplayedSvgUrl({
    generatedReadmeImage,
    previewTheme: editorState.previewTheme,
  });
  const generatedHtml = generatedReadmeImage?.readmeHtml ?? "";

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

  function generatePreview() {
    previewGenerationId.current += 1;

    const generatedReadmeImageResult = generateReadmeImage({
      columnLayouts: editorState.columnLayouts,
      currentOrigin,
      gap: editorState.gap,
      icons: editorState.icons,
      includeDarkTheme: editorState.includeDarkTheme,
      layoutMode: editorState.layoutMode,
    });

    if (!generatedReadmeImageResult.success) {
      setGeneratedReadmeImage(null);
      setValidationErrors(generatedReadmeImageResult.errors);
      setCopyGeneratedHtmlStatus("idle");
      return;
    }

    setGeneratedReadmeImage(generatedReadmeImageResult);
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
