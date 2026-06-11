import {
  validateColumnLayouts,
  type ColumnLayout,
  type EditableColumnLayout,
  type LayoutMode,
} from "./column-layout";
import { parseIconRequest } from "./parse-request";
import { escapeXml } from "../utils";

export type GeneratedImageSource = {
  columns: number;
  minWidthPx: number | null;
  theme: "dark" | "light";
  url: string;
};

export type ReadmeImageGenerationResult =
  | {
      success: true;
      imageSources: GeneratedImageSource[];
      readmeHtml: string;
      unknownSlugs: string[];
    }
  | {
      success: false;
      errors: string[];
    };

type GenerateReadmeImageInput = {
  columnLayouts: readonly EditableColumnLayout[];
  currentOrigin: string;
  gap: string;
  icons: string;
  includeDarkTheme: boolean;
  layoutMode: LayoutMode;
  size: string;
};

export function generateReadmeImage({
  columnLayouts,
  currentOrigin,
  gap,
  icons,
  includeDarkTheme,
  layoutMode,
  size,
}: GenerateReadmeImageInput): ReadmeImageGenerationResult {
  const columnLayoutResult = validateColumnLayouts({
    columnLayouts,
    layoutMode,
  });
  const parsedRequest = parseIconRequest(
    buildIconRequestParams({
      gap,
      icons,
      size,
    }),
  );

  if (!parsedRequest.success || !columnLayoutResult.success) {
    return {
      success: false,
      errors: [
        ...(!parsedRequest.success ? parsedRequest.errors : []),
        ...(!columnLayoutResult.success ? columnLayoutResult.errors : []),
      ],
    };
  }

  if (currentOrigin === "") {
    return {
      success: false,
      errors: [],
    };
  }

  const imageSources = buildGeneratedImageSources({
    columnLayouts: columnLayoutResult.columnLayouts,
    currentOrigin,
    gap,
    icons,
    includeDarkTheme,
    size,
  });
  const labels = isAllIconInput(icons)
    ? "All stack icons"
    : parsedRequest.data.icons.map((icon) => icon.label).join(", ");

  return {
    success: true,
    imageSources,
    readmeHtml: renderReadmeHtml({ imageSources, labels }),
    unknownSlugs: parsedRequest.data.unknownSlugs,
  };
}

function buildGeneratedImageSources({
  columnLayouts,
  currentOrigin,
  gap,
  icons,
  includeDarkTheme,
  size,
}: {
  columnLayouts: readonly ColumnLayout[];
  currentOrigin: string;
  gap: string;
  icons: string;
  includeDarkTheme: boolean;
  size: string;
}): GeneratedImageSource[] {
  return columnLayouts.flatMap((layout) => {
    const lightSource = buildGeneratedImageSource({
      columnLayout: layout,
      currentOrigin,
      gap,
      icons,
      size,
      theme: "light",
    });

    if (!includeDarkTheme) {
      return [lightSource];
    }

    return [
      lightSource,
      buildGeneratedImageSource({
        columnLayout: layout,
        currentOrigin,
        gap,
        icons,
        size,
        theme: "dark",
      }),
    ];
  });
}

function buildGeneratedImageSource({
  columnLayout,
  currentOrigin,
  gap,
  icons,
  size,
  theme,
}: {
  columnLayout: ColumnLayout;
  currentOrigin: string;
  gap: string;
  icons: string;
  size: string;
  theme: "dark" | "light";
}): GeneratedImageSource {
  return {
    columns: columnLayout.columns,
    minWidthPx: columnLayout.minWidthPx,
    theme,
    url: buildReadmeImageUrl({
      columns: columnLayout.columns,
      currentOrigin,
      gap,
      icons,
      size,
      theme,
    }),
  };
}

function renderReadmeHtml({
  imageSources,
  labels,
}: {
  imageSources: readonly GeneratedImageSource[];
  labels: string;
}): string {
  const baseLightSource = getGeneratedImageSource({
    imageSources,
    minWidthPx: null,
    theme: "light",
  });

  if (baseLightSource === undefined) {
    return "";
  }

  const sourceMarkup = [
    ...getResponsiveLightSources(imageSources).flatMap((layout) => {
      const darkSource = getGeneratedImageSource({
        imageSources,
        minWidthPx: layout.minWidthPx,
        theme: "dark",
      });
      const lightSource = getGeneratedImageSource({
        imageSources,
        minWidthPx: layout.minWidthPx,
        theme: "light",
      });

      return [
        ...(darkSource === undefined
          ? []
          : [
              `  <source media="(min-width: ${layout.minWidthPx}px) and (prefers-color-scheme: dark)" srcset="${escapeXml(darkSource.url)}" />`,
            ]),
        ...(lightSource === undefined
          ? []
          : [
              `  <source media="(min-width: ${layout.minWidthPx}px)" srcset="${escapeXml(lightSource.url)}" />`,
            ]),
      ];
    }),
    ...getBaseDarkSourceMarkup(imageSources),
  ];
  const sourceMarkupText =
    sourceMarkup.length === 0 ? "" : `${sourceMarkup.join("\n")}\n`;

  return `<picture>
${sourceMarkupText}  <img src="${escapeXml(baseLightSource.url)}" alt="${escapeXml(labels)}" title="${escapeXml(labels)}" />
</picture>`;
}

function getResponsiveLightSources(
  imageSources: readonly GeneratedImageSource[],
): GeneratedImageSource[] {
  return imageSources
    .filter((source) => source.theme === "light" && source.minWidthPx !== null)
    .sort((a, b) => Number(b.minWidthPx) - Number(a.minWidthPx));
}

function getBaseDarkSourceMarkup(
  imageSources: readonly GeneratedImageSource[],
): string[] {
  const baseDarkSource = getGeneratedImageSource({
    imageSources,
    minWidthPx: null,
    theme: "dark",
  });

  return baseDarkSource === undefined
    ? []
    : [
        `  <source media="(prefers-color-scheme: dark)" srcset="${escapeXml(baseDarkSource.url)}" />`,
      ];
}

function getGeneratedImageSource({
  imageSources,
  minWidthPx,
  theme,
}: {
  imageSources: readonly GeneratedImageSource[];
  minWidthPx: number | null;
  theme: "dark" | "light";
}): GeneratedImageSource | undefined {
  return imageSources.find(
    (source) => source.minWidthPx === minWidthPx && source.theme === theme,
  );
}

function buildIconRequestParams({
  gap,
  icons,
  size,
}: {
  gap: string;
  icons: string;
  size: string;
}): URLSearchParams {
  const params = new URLSearchParams();

  params.set("icons", icons);
  params.set("gap", gap);
  params.set("size", size);

  return params;
}

function buildReadmeImageUrl({
  columns,
  currentOrigin,
  gap,
  icons,
  size,
  theme,
}: {
  columns: number;
  currentOrigin: string;
  gap: string;
  icons: string;
  size: string;
  theme: "dark" | "light";
}): string {
  const url = new URL("/icons", currentOrigin);
  const params = new URLSearchParams();

  if (!isAllIconInput(icons)) {
    params.set("icons", icons);
  }

  params.set("columns", String(columns));
  params.set("gap", gap);
  // Icon size is always explicit so a generated image source never depends on
  // the endpoint's back-compat default of 40 (ADR 0001).
  params.set("size", size);
  params.set("theme", theme);

  url.search = params.toString();

  return url.toString();
}

function isAllIconInput(icons: string): boolean {
  return icons.trim() === "all";
}
