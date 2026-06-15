"use client";

import React from "react";

import {
  addBreakpointLayout,
  copyEditableColumnLayouts,
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getColumnLayoutsForMode,
  getColumnLayoutRichResult,
  getEditableBaseColumnLayout,
  removeBreakpointLayout,
} from "@/lib/icons/column-layout";
import { showToast } from "@/components/ui/sonner";
import { generateReadmeImage } from "@/lib/icons/readme-image";

import {
  buildStackIconsEditorPageQuery,
  DEFAULT_ICON_SIZE,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  type LayoutMode,
  type StackIconsEditorState,
} from "./state";
import type { EditableColumnLayout } from "@/lib/icons/column-layout";

export { DEFAULT_ICON_SIZE };

type LayoutMemoryState = {
  singleColumnLayout: EditableColumnLayout;
  responsiveColumnLayouts: EditableColumnLayout[];
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
    size: editorState.iconSize,
  });
  const generatedReadmeImage = generatedReadmeImageResult.success
    ? generatedReadmeImageResult
    : null;

  const columnLayoutResult = getColumnLayoutRichResult({
    columnLayouts: editorState.columnLayouts,
    layoutMode: editorState.layoutMode,
  });

  // Unified column layouts updater: all column-related mutations go through here
  // so commit + memory + URL replace side effects are in one place.
  function applyColumnLayouts(nextColumnLayouts: EditableColumnLayout[]) {
    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: nextColumnLayouts,
    };
    commitEditorState(nextState);
  }

  const generatedHtml = generatedReadmeImage?.readmeHtml ?? "";
  const generatedImageSources = generatedReadmeImage?.imageSources ?? [];
  const unknownSlugs = generatedReadmeImage?.unknownSlugs ?? [];
  const hasGeneratedOutput = generatedReadmeImage !== null;
  const validationErrors = generatedReadmeImageResult.success
    ? []
    : generatedReadmeImageResult.errors;
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
    const nextColumnLayouts = editorState.columnLayouts.map((layout) =>
      layout.minWidthPx === null ? { ...layout, columns } : layout,
    );
    applyColumnLayouts(nextColumnLayouts);
  }

  function updateColumnLayout(
    layoutIndex: number,
    field: keyof EditableColumnLayout,
    value: string,
  ) {
    const targetLayout = editorState.columnLayouts[layoutIndex];

    if (targetLayout === undefined) {
      return;
    }

    const nextColumnLayouts = editorState.columnLayouts.map(
      (layout, currentIndex) =>
        currentIndex === layoutIndex ? { ...layout, [field]: value } : layout,
    );
    applyColumnLayouts(nextColumnLayouts);
  }

  function handleAddBreakpointLayout() {
    if (editorState.layoutMode !== "responsive") {
      return;
    }

    const nextLayouts = addBreakpointLayout(
      editorState.columnLayouts,
      editorState.layoutMode,
    );

    applyColumnLayouts(nextLayouts);
  }

  function handleRemoveBreakpointLayout(layoutIndex: number) {
    if (editorState.layoutMode !== "responsive") {
      return;
    }

    const nextLayouts = removeBreakpointLayout(
      editorState.columnLayouts,
      layoutIndex,
    );

    applyColumnLayouts(nextLayouts);
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
          ? copyEditableColumnLayouts(editorState.columnLayouts)
          : layoutMemory.responsiveColumnLayouts,
    };
    const nextColumnLayouts = getColumnLayoutsForMode(
      nextMemory.singleColumnLayout,
      nextMemory.responsiveColumnLayouts,
      layoutMode,
    );
    const nextState: StackIconsEditorState = {
      ...editorState,
      layoutMode,
      columnLayouts: nextColumnLayouts,
    };

    setLayoutMemory(nextMemory);
    setEditorState(nextState);
    replaceEditorUrl(nextState);
  }

  // Copies the exact generated README image code string — the same string the
  // highlighted code panel renders. Success is reported by the caller's copy
  // button via the returned flag; failures surface a toast here.
  async function copyReadmeImageCode(): Promise<boolean> {
    if (generatedHtml === "") {
      return false;
    }

    const clipboard = navigator.clipboard;

    try {
      if (clipboard === undefined) {
        throw new Error("Clipboard is unavailable");
      }

      await clipboard.writeText(generatedHtml);
      return true;
    } catch {
      showToast("Copy failed — select and copy manually");
      return false;
    }
  }

  return {
    addBreakpointLayout: handleAddBreakpointLayout,
    columnLayoutResult,
    copyReadmeImageCode,
    generatedHtml,
    generatedImageSources,
    hasGeneratedOutput,
    removeBreakpointLayout: handleRemoveBreakpointLayout,
    state: editorState,
    switchLayoutMode,
    unknownSlugs,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  };
}
