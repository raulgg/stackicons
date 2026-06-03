import { readFile } from "node:fs/promises";
import path from "node:path";

const rawSvgCache = new Map<string, Promise<string>>();

export async function readRawSvgAsset(assetPath: string): Promise<string> {
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
