import { z } from "zod";

import { getIconBySlug, isIconSlug } from "./registry";
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
  s: z
    .string()
    .min(1, "`s` must include at least one icon slug.")
    .refine(
      (value) => parseRawIconSlugs(value).length <= maxIconSlugs,
      "`s` must include 1000 icons or fewer.",
    ),
  columns: z.coerce
    .number()
    .int("`cols` must be an integer.")
    .min(2, "`cols` must be at least 2.")
    .max(20, "`cols` must be at most 20.")
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
  const sParam = searchParams.get("s");
  if (sParam === null) {
    return {
      success: false,
      errors: ["`s` is required."],
    };
  }

  const rawRequest = rawIconRequestSchema.safeParse({
    s: sParam,
    columns: searchParams.get("cols") ?? undefined,
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

  const slugs = parseRawIconSlugs(rawRequest.data.s);

  if (slugs.length === 0) {
    return {
      success: false,
      errors: ["`s` must include at least one icon slug."],
    };
  }

  const unknownSlugs = slugs.filter((slug) => !isIconSlug(slug));
  const registeredSlugs = slugs.filter(isIconSlug);

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
