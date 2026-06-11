import { readFile } from "node:fs/promises";
import path from "node:path";

import { getIconGridLayout } from "./layout";
import { normalizeTrustedSvgAsset } from "./normalize-svg";
import { getIconAssetPath } from "./registry";
import { escapeXml } from "../utils";
import type { ParsedIconRequest } from "./parse-request";

const rawSvgCache = new Map<string, Promise<string>>();
const maxVisibleErrorMessageLength = 60;

export async function renderIconSvg({
  columns,
  gap,
  icons,
  size,
  theme,
}: ParsedIconRequest): Promise<string> {
  const gridLayout = getIconGridLayout({
    columns,
    gap,
    iconCount: icons.length,
    iconSize: size,
  });
  const title = icons.map((icon) => icon.label).join(", ");
  const description = `Technology stack icons for ${title}.`;
  const iconMarkup = await Promise.all(
    gridLayout.placements.map(async (placement) => {
      const icon = icons[placement.index];

      if (icon === undefined) {
        throw new Error("Icon grid placement must reference a requested icon.");
      }

      const assetPath = getIconAssetPath({ slug: icon.slug, theme });
      const assetSvg = await readRawSvgAsset(assetPath);
      const normalizedSvg = normalizeTrustedSvgAsset({
        occurrence: placement.index,
        slug: icon.slug,
        sourceSvg: assetSvg,
      });

      return `<svg x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" ${normalizedSvg.attributes} aria-hidden="true" focusable="false">
    ${normalizedSvg.body}
  </svg>`;
    }),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${gridLayout.width}" height="${gridLayout.height}" viewBox="0 0 ${gridLayout.width} ${gridLayout.height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  ${iconMarkup.join("\n  ")}
</svg>`;
}

export function renderIconRequestErrorSvg(errors: readonly string[]): string {
  const message = errors.join(" ");
  const escapedMessage = escapeXml(message);
  const escapedVisibleMessage = escapeXml(
    truncateMessage(message, maxVisibleErrorMessageLength),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120" viewBox="0 0 640 120" role="img" aria-labelledby="title desc">
  <title id="title">Invalid StackIcons request</title>
  <desc id="desc">${escapedMessage}</desc>
  <rect width="640" height="120" fill="#ffffff"/>
  <g transform="translate(32 28) scale(3)" fill="#64748b">
    <path d="M19 3a2 2 0 0 1 2 2v6h-2v2h-2v2h-2v2h-2v2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 12v4a2 2 0 0 1-2 2h-4v-2h2v-2h2v-2zm-2-6.5a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5H11v-1h2v-2h2v-2h2V9h2z"/>
  </g>
  <text x="144" y="55" fill="#475569" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="700">Invalid icon request</text>
  <text x="144" y="82" fill="#64748b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14">${escapedVisibleMessage}</text>
</svg>`;
}

async function readRawSvgAsset(assetPath: string): Promise<string> {
  const cachedSvg = rawSvgCache.get(assetPath);

  if (cachedSvg) {
    return cachedSvg;
  }

  const svgPromise = readFile(
    path.join(process.cwd(), "assets", "icons", path.basename(assetPath)),
    "utf8",
  );
  rawSvgCache.set(assetPath, svgPromise);
  return svgPromise;
}

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength - 3)}...`;
}
