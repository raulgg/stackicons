"use client";

import React from "react";

import { getIconGridDimensions } from "@/lib/icons/layout";
import { parseIconRequest } from "@/lib/icons/parse-request";
import { escapeXml } from "@/lib/utils";

import type { StackIconsEditorState } from "./state";

function buildPageQuery(state: StackIconsEditorState): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", state.columns);
  params.set("gap", state.gap);
  params.set("include-dark-theme", String(state.includeDarkTheme));

  return params.toString();
}

function buildIconRequestParams(state: StackIconsEditorState): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", state.columns);
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

  return url.toString();
}

function buildReadmeImageUrl(
  state: StackIconsEditorState,
  currentOrigin: string,
  theme: "dark" | "light",
): string {
  if (currentOrigin === "") {
    return "";
  }

  const url = new URL("/icons", currentOrigin);
  const params = new URLSearchParams();

  if (!isAllIconState(state)) {
    params.set("icons", state.icons);
  }

  params.set("columns", state.columns);
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
  const { height, width } = getIconGridDimensions({
    columns: parsedRequest.data.columns,
    gap: parsedRequest.data.gap,
    iconCount: parsedRequest.data.icons.length,
  });

  const darkSourceUrl = state.includeDarkTheme
    ? buildReadmeImageUrl(state, currentOrigin, "dark")
    : "";
  const darkSource =
    darkSourceUrl === ""
      ? ""
      : `  <source media="(prefers-color-scheme: dark)" srcset="${escapeXml(darkSourceUrl)}" />
`;

  return `<picture>
${darkSource}  <img src="${escapeXml(fallbackUrl)}" alt="${escapeXml(labels)}" title="${escapeXml(labels)}" width="${width}" height="${height}" />
</picture>`;
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
  const generatedHtml =
    previewState === null ? "" : buildReadmeHtml(previewState, currentOrigin);

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
    generatedHtml,
    generatedUrl,
    state: editorState,
    updateField,
    validationErrors,
  };
}
