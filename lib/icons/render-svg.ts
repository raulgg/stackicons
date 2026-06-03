import { readFile } from "node:fs/promises";
import path from "node:path";

import { getIconAssetPath } from "./registry";
import { escapeXml } from "./svg-utils";
import type { ParsedIconRequest } from "./parse-request";

const iconSize = 40;
const rawSvgCache = new Map<string, Promise<string>>();

export async function renderIconSvg({
  columns,
  gap,
  icons,
  theme,
}: ParsedIconRequest): Promise<string> {
  const rows = Math.ceil(icons.length / columns);
  const usedColumns = Math.min(columns, icons.length);
  const width = usedColumns * iconSize + Math.max(usedColumns - 1, 0) * gap;
  const height = rows * iconSize + Math.max(rows - 1, 0) * gap;
  const title = icons.map((icon) => icon.label).join(", ");
  const description = `Technology stack icons for ${title}.`;
  const iconMarkup = await Promise.all(
    icons.map(async (icon, index) => {
      const x = (index % columns) * (iconSize + gap);
      const y = Math.floor(index / columns) * (iconSize + gap);
      const assetPath = getIconAssetPath({ slug: icon.slug, theme });
      const assetSvg = await readRawSvg(assetPath);
      const inlinedSvg = inlineSourceSvg({
        occurrence: index,
        slug: icon.slug,
        sourceSvg: assetSvg,
      });

      return `<svg x="${x}" y="${y}" width="${iconSize}" height="${iconSize}" viewBox="${inlinedSvg.viewBox}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    ${inlinedSvg.body}
  </svg>`;
    }),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  ${iconMarkup.join("\n  ")}
</svg>`;
}

async function readRawSvg(assetPath: string): Promise<string> {
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

function inlineSourceSvg({
  occurrence,
  slug,
  sourceSvg,
}: {
  occurrence: number;
  slug: string;
  sourceSvg: string;
}): { body: string; viewBox: string } {
  const strippedSvg = sourceSvg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!doctype[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  rejectExternalReferences(strippedSvg);

  const rootMatch = strippedSvg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/i);

  if (!rootMatch) {
    throw new Error("Icon asset must be an SVG document.");
  }

  const [, rootAttributes, body] = rootMatch;
  const viewBox = readAttribute(rootAttributes, "viewBox") ?? deriveViewBox(rootAttributes);
  const idPrefix = `icon-${slug}-${occurrence}`;

  return {
    body: prefixInternalIds(body.trim(), idPrefix),
    viewBox,
  };
}

function deriveViewBox(rootAttributes: string): string {
  const width = readNumericAttribute(rootAttributes, "width");
  const height = readNumericAttribute(rootAttributes, "height");

  if (width === undefined || height === undefined) {
    throw new Error("Icon asset must include a viewBox or numeric width and height.");
  }

  return `0 0 ${width} ${height}`;
}

function readAttribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`, "i"));
  return match?.[2];
}

function readNumericAttribute(
  attributes: string,
  name: string,
): number | undefined {
  const value = readAttribute(attributes, name);

  if (!value) {
    return undefined;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)(?:px)?$/);
  return match ? Number(match[1]) : undefined;
}

function rejectExternalReferences(svg: string): void {
  if (/<image\b/i.test(svg)) {
    throw new Error("Icon asset must not include image references.");
  }

  if (/\b(?:href|src)=["'](?!#)[^"']+["']/i.test(svg)) {
    throw new Error("Icon asset must not include external references.");
  }

  if (/@import\b|url\((?!["']?#)/i.test(svg)) {
    throw new Error("Icon asset must not include external references.");
  }
}

function prefixInternalIds(svg: string, prefix: string): string {
  const ids = Array.from(svg.matchAll(/\bid=(["'])([^"']+)\1/g), (match) => match[2]);

  return ids.reduce((rewrittenSvg, id) => {
    const prefixedId = `${prefix}-${id}`;
    const escapedId = escapeRegExp(id);

    return rewrittenSvg
      .replace(new RegExp(`\\bid=(["'])${escapedId}\\1`, "g"), `id="${
        prefixedId
      }"`)
      .replace(new RegExp(`url\\(#${escapedId}\\)`, "g"), `url(#${prefixedId})`)
      .replace(new RegExp(`\\b(?:href|xlink:href)=(["'])#${escapedId}\\1`, "g"), (match) =>
        match.replace(`#${id}`, `#${prefixedId}`),
      );
  }, svg);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
