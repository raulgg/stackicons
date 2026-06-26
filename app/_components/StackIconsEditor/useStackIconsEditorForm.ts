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
  getColumnLayoutRichResult,
  getEditableBaseColumnLayout,
  removeBreakpointLayout,
} from "@/lib/icons/column-layout";
import { generateIconsImage } from "@/lib/icons/icons-image";

import { parseIconSlugs } from "./IconPicker";
import {
  buildStackIconsEditorPageQuery,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  type StackIconsEditorState,
} from "./state";
import type { EditableColumnLayout } from "@/lib/icons/column-layout";

function getBaseColumnLayout(state: StackIconsEditorState) {
  return getEditableBaseColumnLayout(state.columnLayouts);
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

function getIconsImageCodeEmptyPlaceholder({
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
  const generatedIconsImageResult = generateIconsImage({
    columnLayouts: editorState.columnLayouts,
    currentOrigin,
    gap: editorState.gap,
    icons: editorState.icons,
    includeDarkTheme: true,
    size: editorState.iconSize,
  });
  const generatedIconsImage = generatedIconsImageResult.success
    ? generatedIconsImageResult
    : null;

  const columnLayoutResult = getColumnLayoutRichResult({
    columnLayouts: editorState.columnLayouts,
  });

  // Unified column layouts updater: all column-related mutations go through here
  // so commit + URL replace side effects are in one place.
  function applyColumnLayouts(nextColumnLayouts: EditableColumnLayout[]) {
    const nextState: StackIconsEditorState = {
      ...editorState,
      columnLayouts: nextColumnLayouts,
    };
    commitEditorState(nextState);
  }

  const unknownSlugs = generatedIconsImage?.unknownSlugs ?? [];
  const hasUnknownSlugs = unknownSlugs.length > 0;
  const generatedHtml = hasUnknownSlugs
    ? ""
    : (generatedIconsImage?.iconsImageCode ?? "");
  const generatedImageSources = hasUnknownSlugs
    ? []
    : (generatedIconsImage?.imageSources ?? []);
  const hasGeneratedOutput = generatedIconsImage !== null && !hasUnknownSlugs;
  const validationErrors = generatedIconsImageResult.success
    ? []
    : generatedIconsImageResult.errors;
  const iconsImageCodeEmptyPlaceholder = getIconsImageCodeEmptyPlaceholder({
    hasIcons: parseIconSlugs(editorState.icons).length > 0,
    validationErrorCount: hasUnknownSlugs ? 1 : validationErrors.length,
  });
  function commitEditorState(nextState: StackIconsEditorState) {
    setEditorState(nextState);
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
    const nextLayouts = addBreakpointLayout(editorState.columnLayouts);
    applyColumnLayouts(nextLayouts);
  }

  function handleRemoveBreakpointLayout(layoutIndex: number) {
    const nextLayouts = removeBreakpointLayout(
      editorState.columnLayouts,
      layoutIndex,
    );
    applyColumnLayouts(nextLayouts);
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
    iconsImageCodeEmptyPlaceholder,
    removeBreakpointLayout: handleRemoveBreakpointLayout,
    state: editorState,
    unknownSlugs,
    updateBaseColumns,
    updateColumnLayout,
    updateField,
    validationErrors,
  };
}
