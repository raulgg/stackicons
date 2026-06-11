import { z } from "zod";

import { getIconBySlug, isIconSlug, listIconSlugs } from "./registry";
import type { IconSlug, RegisteredIcon } from "./registry";

export type IconRequestTheme = "light" | "dark";

export type ParsedIconRequest = {
  icons: RegisteredIcon[];
  slugs: IconSlug[];
  unknownSlugs: string[];
  columns: number;
  gap: number;
  size: number;
  theme: IconRequestTheme;
};

export type IconRequestParseResult =
  | {
      success: true;
      data: ParsedIconRequest;
    }
  | {
      success: false;
      errors: string[];
    };

const maxIconSlugs = 1000;

const rawIconRequestSchema = z.object({
  icons: z.preprocess(
    (value) => (value === undefined ? "all" : value),
    z
      .string()
      .min(1, "`icons` must include at least one icon slug.")
      .refine(
        (value) => parseRawIconSlugs(value).length <= maxIconSlugs,
        "`icons` must include 1000 icons or fewer.",
      ),
  ),
  columns: z.coerce
    .number()
    .int("`columns` must be an integer.")
    .min(2, "`columns` must be at least 2.")
    .max(20, "`columns` must be at most 20.")
    .default(16),
  gap: z.coerce
    .number()
    .int("`gap` must be an integer.")
    .min(0, "`gap` must be at least 0.")
    .max(24, "`gap` must be at most 24.")
    .default(8),
  // Generated image source URLs in the wild predate the `size` param, so an
  // absent `size` keeps the pre-existing 40px icon size (ADR 0001).
  size: z.coerce
    .number()
    .int("`size` must be an integer.")
    .min(24, "`size` must be at least 24.")
    .max(64, "`size` must be at most 64.")
    .default(40),
  theme: z.enum(["light", "dark"]).default("light"),
  v: z.string().optional(),
});

export function parseIconRequest(
  searchParams: URLSearchParams,
): IconRequestParseResult {
  const rawRequest = rawIconRequestSchema.safeParse({
    icons: searchParams.get("icons") ?? undefined,
    columns: searchParams.get("columns") ?? undefined,
    gap: searchParams.get("gap") ?? undefined,
    size: searchParams.get("size") ?? undefined,
    theme: searchParams.get("theme") ?? undefined,
    v: searchParams.get("v") ?? undefined,
  });

  if (!rawRequest.success) {
    return {
      success: false,
      errors: rawRequest.error.issues.map((issue) => issue.message),
    };
  }

  const slugs = parseRawIconSlugs(rawRequest.data.icons);

  if (slugs.length === 0) {
    return {
      success: false,
      errors: ["`icons` must include at least one icon slug."],
    };
  }

  const requestedAllIcons = slugs.length === 1 && slugs[0] === "all";
  const resolvedSlugs = requestedAllIcons ? [...listIconSlugs()] : slugs;
  const unknownSlugs = resolvedSlugs.filter((slug) => !isIconSlug(slug));
  const registeredSlugs = resolvedSlugs.filter(isIconSlug);

  if (registeredSlugs.length === 0) {
    return {
      success: false,
      errors: [formatUnknownSlugsMessage(unknownSlugs)],
    };
  }

  return {
    success: true,
    data: {
      icons: registeredSlugs.map((slug) => getIconBySlug(slug)).filter(isIcon),
      slugs: registeredSlugs,
      unknownSlugs,
      columns: rawRequest.data.columns,
      gap: rawRequest.data.gap,
      size: rawRequest.data.size,
      theme: rawRequest.data.theme,
    },
  };
}

export function formatUnknownSlugsMessage(
  unknownSlugs: readonly string[],
): string {
  return `Unknown icon slug${unknownSlugs.length === 1 ? "" : "s"}: ${unknownSlugs.join(
    ", ",
  )}.`;
}

function parseRawIconSlugs(icons: string): string[] {
  return icons
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function isIcon(icon: RegisteredIcon | undefined): icon is RegisteredIcon {
  return icon !== undefined;
}
