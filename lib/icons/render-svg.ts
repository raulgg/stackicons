import { normalizeTrustedSvgAsset } from "./normalize-svg";
import { readRawSvgAsset } from "./raw-svg-cache";
import { getIconAssetPath } from "./registry";
import { escapeXml } from "./svg-utils";
import type { ParsedIconRequest } from "./parse-request";

const iconSize = 40;

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
      const assetSvg = await readRawSvgAsset(assetPath);
      const normalizedSvg = normalizeTrustedSvgAsset({
        occurrence: index,
        slug: icon.slug,
        sourceSvg: assetSvg,
      });

      return `<svg x="${x}" y="${y}" width="${iconSize}" height="${iconSize}" ${normalizedSvg.attributes} aria-hidden="true" focusable="false">
    ${normalizedSvg.body}
  </svg>`;
    }),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  ${iconMarkup.join("\n  ")}
</svg>`;
}
