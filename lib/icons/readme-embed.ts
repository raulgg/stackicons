import {
  getReadmeSourceColumnLayouts,
  validateColumnLayouts,
  type EditableColumnLayout,
  type LayoutMode,
} from "./column-layout";
import { parseIconRequest } from "./parse-request";
import { escapeXml } from "../utils";

type BuildReadmeEmbedHtmlInput = {
  columnLayouts: readonly EditableColumnLayout[];
  currentOrigin: string;
  gap: string;
  icons: string;
  includeDarkTheme: boolean;
  layoutMode: LayoutMode;
};

export function buildReadmeEmbedHtml({
  columnLayouts,
  currentOrigin,
  gap,
  icons,
  includeDarkTheme,
  layoutMode,
}: BuildReadmeEmbedHtmlInput): string {
  const columnLayoutResult = validateColumnLayouts({
    columnLayouts,
    layoutMode,
  });

  if (!columnLayoutResult.success) {
    return "";
  }

  const baseColumnLayout = columnLayoutResult.columnLayouts.find(
    (layout) => layout.minWidthPx === null,
  );
  const parsedRequest = parseIconRequest(
    buildIconRequestParams({
      columns: baseColumnLayout?.columns,
      gap,
      icons,
    }),
  );

  if (!parsedRequest.success) {
    return "";
  }

  const fallbackUrl = buildReadmeImageUrl({
    columns: baseColumnLayout?.columns,
    currentOrigin,
    gap,
    icons,
    theme: "light",
  });

  if (fallbackUrl === "") {
    return "";
  }

  const labels = isAllIconInput(icons)
    ? "All stack icons"
    : parsedRequest.data.icons.map((icon) => icon.label).join(", ");
  const sources: string[] = [];

  for (const layout of getReadmeSourceColumnLayouts(
    columnLayoutResult.columnLayouts,
  )) {
    const media = `(min-width: ${layout.minWidthPx}px)`;

    if (includeDarkTheme) {
      sources.push(
        `  <source media="${media} and (prefers-color-scheme: dark)" srcset="${escapeXml(
          buildReadmeImageUrl({
            columns: layout.columns,
            currentOrigin,
            gap,
            icons,
            theme: "dark",
          }),
        )}" />`,
      );
    }

    sources.push(
      `  <source media="${media}" srcset="${escapeXml(
        buildReadmeImageUrl({
          columns: layout.columns,
          currentOrigin,
          gap,
          icons,
          theme: "light",
        }),
      )}" />`,
    );
  }

  if (includeDarkTheme) {
    sources.push(
      `  <source media="(prefers-color-scheme: dark)" srcset="${escapeXml(
        buildReadmeImageUrl({
          columns: baseColumnLayout?.columns,
          currentOrigin,
          gap,
          icons,
          theme: "dark",
        }),
      )}" />`,
    );
  }

  const sourceMarkup = sources.length === 0 ? "" : `${sources.join("\n")}\n`;

  return `<picture>
${sourceMarkup}  <img src="${escapeXml(fallbackUrl)}" alt="${escapeXml(labels)}" title="${escapeXml(labels)}" width="100%" />
</picture>`;
}

function buildIconRequestParams({
  columns,
  gap,
  icons,
}: {
  columns: number | string | undefined;
  gap: string;
  icons: string;
}): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", icons);

  if (columns !== undefined) {
    params.set("columns", String(columns));
  }

  params.set("gap", gap);

  return params;
}

function buildReadmeImageUrl({
  columns,
  currentOrigin,
  gap,
  icons,
  theme,
}: {
  columns: number | string | undefined;
  currentOrigin: string;
  gap: string;
  icons: string;
  theme: "dark" | "light";
}): string {
  if (currentOrigin === "") {
    return "";
  }

  const url = new URL("/icons", currentOrigin);
  const params = new URLSearchParams();

  if (!isAllIconInput(icons)) {
    params.set("icons", icons);
  }

  if (columns !== undefined) {
    params.set("columns", String(columns));
  }

  params.set("gap", gap);
  params.set("theme", theme);

  url.search = params.toString();

  return url.toString();
}

function isAllIconInput(icons: string): boolean {
  return icons.trim() === "all";
}
