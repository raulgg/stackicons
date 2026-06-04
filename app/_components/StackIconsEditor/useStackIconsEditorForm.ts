"use client";

import React from "react";

import { parseIconRequest } from "@/lib/icons/parse-request";

import type { StackIconsEditorState } from "./state";

function buildPageQuery(state: StackIconsEditorState): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", state.columns);
  params.set("gap", state.gap);

  return params.toString();
}

function buildIconRequestParams(state: StackIconsEditorState): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", state.icons.trim() === "" ? "all" : state.icons);
  params.set("columns", state.columns);
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

  const generatedUrl =
    previewState === null ? "" : buildIconsUrl(previewState, currentOrigin);

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
  }

  function generatePreview() {
    const parsedRequest = parseIconRequest(buildIconRequestParams(editorState));

    if (!parsedRequest.success) {
      setPreviewState(null);
      setValidationErrors(parsedRequest.errors);
      return;
    }

    setPreviewState(editorState);
    setValidationErrors([]);
  }

  return {
    generatePreview,
    generatedUrl,
    state: editorState,
    updateField,
    validationErrors,
  };
}
