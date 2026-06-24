"use client";

import React from "react";

import {
  ADD_ICONS_IMAGE_CODE_PLACEHOLDER,
  FIX_ERRORS_IMAGE_CODE_PLACEHOLDER,
} from "@/app/_components/readme";
import { showToast } from "@/components/ui/sonner";
import {
  addBreakpointLayout,
  copyEditableColumnLayouts,
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  getColumnLayoutsForMode,
  getColumnLayoutRichResult,
  getEditableBaseColumnLayout,
  removeBreakpointLayout,
} from "@/lib/icons/column-layout";
import { generateIconsImage } from "@/lib/icons/icons-image";

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

export function getIconsImageCodeEmptyPlaceholder({
  hasIcons,
  validationErrorCount,
}: {
  hasIcons: boolean;
  validationErrorCount: number;
}): string | undefined {
  if (!hasIcons) {
    return ADD_ICONS_IMAGE_CODE_PLACEHOLDER;
  }

  if (validationErrorCount > 0) {
    return FIX_ERRORS_IMAGE_CODE_PLACEHOLDER;
  }

  return undefined;
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
  const generatedIconsImageResult = generateIconsImage({
    columnLayouts: editorState.columnLayouts,
    currentOrigin,
    gap: editorState.gap,
    icons: editorState.icons,
    includeDarkTheme: true,
    layoutMode: editorState.layoutMode,
    size: editorState.iconSize,
  });
  const generatedIconsImage = generatedIconsImageResult.success
    ? generatedIconsImageResult
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

  const generatedHtml = generatedIconsImage?.iconsImageCode ?? "";
  const generatedImageSources = generatedIconsImage?.imageSources ?? [];
  const unknownSlugs = generatedIconsImage?.unknownSlugs ?? [];
  const hasGeneratedOutput = generatedIconsImage !== null;
  const validationErrors = generatedIconsImageResult.success
    ? []
    : generatedIconsImageResult.errors;
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

  async function copyIconsImageCode(): Promise<boolean> {
    if (generatedHtml === "") {
      return false;
    }

    const clipboard = navigator.clipboard;
    if (!clipboard) {
      showToast("Copy failed — select and copy manually");
      return false;
    }

    try {
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
    copyIconsImageCode,
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
