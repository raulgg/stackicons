"use client";

import React from "react";

import { parseIconRequest } from "@/lib/icons/parse-request";
import { escapeXml } from "@/lib/utils";

import type { StackIconsEditorState } from "./state";

type CopyGeneratedHtmlStatus = "failed" | "idle" | "succeeded";

const responsiveBreakpointTiers = [
  { columns: "18", mediaQuery: "(min-width: 1280px)" }, // desktop
  { columns: "14", mediaQuery: "(min-width: 1024px)" }, // desktop-md
  { columns: "10", mediaQuery: "(min-width: 768px)" }, // desktop-sm
  { columns: "12", mediaQuery: "(min-width: 481px) and (max-width: 769px)" }, // mobile
  { columns: "8", mediaQuery: "(max-width: 480px)" }, // mobile-sm
] as const;

function buildPageQuery(state: StackIconsEditorState): string {
  const params = new URLSearchParams();

  params.set("icons", state.icons);
  params.set("columns", state.columns);
  params.set("gap", state.gap);
  params.set("include-dark-theme", String(state.includeDarkTheme));
  params.set("preview-theme", state.previewTheme);
  params.set("responsive", String(state.responsive));

  return params.toString();
}

function buildIconRequestParams(
  state: StackIconsEditorState,
  columns = state.columns,
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
  columns = state.columns,
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
  const darkSourceUrl = state.includeDarkTheme
    ? buildReadmeImageUrl(state, currentOrigin, "dark")
    : "";
  const sources: string[] = [];

  if (state.responsive) {
    for (const tier of responsiveBreakpointTiers) {
      const lightSourceUrl = buildReadmeImageUrl(
        state,
        currentOrigin,
        "light",
        tier.columns,
      );

      if (state.includeDarkTheme) {
        const darkSourceUrl = buildReadmeImageUrl(
          state,
          currentOrigin,
          "dark",
          tier.columns,
        );

        sources.push(
          `  <source media="${tier.mediaQuery} and (prefers-color-scheme: dark)" srcset="${escapeXml(darkSourceUrl)}" />`,
        );
      }

      sources.push(
        `  <source media="${tier.mediaQuery}" srcset="${escapeXml(lightSourceUrl)}" />`,
      );
    }
  }

  if (!state.responsive && darkSourceUrl !== "") {
    sources.push(
      `  <source media="(prefers-color-scheme: dark)" srcset="${escapeXml(darkSourceUrl)}" />`,
    );
  }

  const sourceMarkup = sources.length === 0 ? "" : `${sources.join("\n")}\n`;

  return `<picture>
${sourceMarkup}  <img src="${escapeXml(fallbackUrl)}" alt="${escapeXml(labels)}" title="${escapeXml(labels)}" width="100%" />
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
  const [copyGeneratedHtmlStatus, setCopyGeneratedHtmlStatus] =
    React.useState<CopyGeneratedHtmlStatus>("idle");
  const previewGenerationId = React.useRef(0);

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

  function generatePreview() {
    previewGenerationId.current += 1;

    const parsedRequest = parseIconRequest(buildIconRequestParams(editorState));

    if (!parsedRequest.success) {
      setPreviewState(null);
      setValidationErrors(parsedRequest.errors);
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
    copyGeneratedHtml,
    copyGeneratedHtmlStatus,
    generatePreview,
    generatedHtml,
    generatedUrl,
    state: editorState,
    updateField,
    validationErrors,
  };
}
