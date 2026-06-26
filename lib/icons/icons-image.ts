import {
  validateColumnLayouts,
  type ColumnLayout,
  type EditableColumnLayout,
} from "./column-layout";
import { parseIconRequest } from "./parse-request";
import { escapeXml } from "../utils";

export type GeneratedIconsImage = {
  columns: number;
  minWidthPx: number | null;
  theme: "dark" | "light";
  url: string;
};

export type IconsImageGenerationResult =
  | {
      success: true;
      imageSources: GeneratedIconsImage[];
      iconsImageCode: string;
      unknownSlugs: string[];
    }
  | {
      success: false;
      errors: string[];
    };

type GenerateIconsImageInput = {
  columnLayouts: readonly EditableColumnLayout[];
  currentOrigin: string;
  gap: string;
  icons: string;
  includeDarkTheme: boolean;
  size: string;
};

export function generateIconsImage({
  columnLayouts,
  currentOrigin,
  gap,
  icons,
  includeDarkTheme,
  size,
}: GenerateIconsImageInput): IconsImageGenerationResult {
  const columnLayoutResult = validateColumnLayouts({ columnLayouts });
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
  const imageSources = buildGeneratedIconsImages({
    columnLayouts: columnLayoutResult.columnLayouts,
    currentOrigin,
    gap,
    icons,
    includeDarkTheme,
    size,
  });

  const labels = parsedRequest.data.icons.map((icon) => icon.label).join(", ");

  return {
    success: true,
    imageSources,
    iconsImageCode: renderIconsImageCode({ imageSources, labels }),
    unknownSlugs: parsedRequest.data.unknownSlugs,
  };
}

function buildGeneratedIconsImages({
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
}): GeneratedIconsImage[] {
  return columnLayouts.flatMap((layout) => {
    const lightSource = buildGeneratedIconsImage({
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
      buildGeneratedIconsImage({
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

function buildGeneratedIconsImage({
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
}): GeneratedIconsImage {
  return {
    columns: columnLayout.columns,
    minWidthPx: columnLayout.minWidthPx,
    theme,
    url: buildIconsImageUrl({
      columns: columnLayout.columns,
      currentOrigin,
      gap,
      icons,
      size,
      theme,
    }),
  };
}

function renderIconsImageCode({
  imageSources,
  labels,
}: {
  imageSources: readonly GeneratedIconsImage[];
  labels: string;
}): string {
  const baseLightSource = getGeneratedIconsImage({
    imageSources,
    minWidthPx: null,
    theme: "light",
  });

  if (baseLightSource === undefined) {
    return "";
  }

  const sourceMarkup = [
    ...getResponsiveLightSources(imageSources).flatMap((layout) => {
      const darkSource = getGeneratedIconsImage({
        imageSources,
        minWidthPx: layout.minWidthPx,
        theme: "dark",
      });
      const lightSource = getGeneratedIconsImage({
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
  imageSources: readonly GeneratedIconsImage[],
): GeneratedIconsImage[] {
  return imageSources
    .filter((source) => source.theme === "light" && source.minWidthPx !== null)
    .sort((a, b) => Number(b.minWidthPx) - Number(a.minWidthPx));
}

function getBaseDarkSourceMarkup(
  imageSources: readonly GeneratedIconsImage[],
): string[] {
  const baseDarkSource = getGeneratedIconsImage({
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

function getGeneratedIconsImage({
  imageSources,
  minWidthPx,
  theme,
}: {
  imageSources: readonly GeneratedIconsImage[];
  minWidthPx: number | null;
  theme: "dark" | "light";
}): GeneratedIconsImage | undefined {
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

  params.set("s", icons);
  params.set("gap", gap);
  params.set("size", size);

  return params;
}

function buildIconsImageUrl({
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

  params.set("s", icons);

  params.set("cols", String(columns));
  params.set("gap", gap);
  // Icon size is always explicit so a generated icons image never depends on
  // the endpoint's back-compat default of 40 (ADR 0001).
  params.set("size", size);
  params.set("theme", theme);

  url.search = params.toString();

  return url.toString();
}
