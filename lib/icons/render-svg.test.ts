import { describe, expect, it } from "vitest";

import { getIconBySlug } from "./registry";
import { renderIconSvg } from "./render-svg";
import type { ParsedIconRequest } from "./parse-request";
import type { IconSlug, RegisteredIcon } from "./registry";

function icon(slug: IconSlug): RegisteredIcon {
  const registeredIcon = getIconBySlug(slug);

  if (!registeredIcon) {
    throw new Error(`Missing test icon: ${slug}`);
  }

  return registeredIcon;
}

function request(overrides: Partial<ParsedIconRequest>): ParsedIconRequest {
  return {
    icons: [icon("typescript")],
    slugs: ["typescript"],
    columns: 16,
    gap: 8,
    theme: "light",
    ...overrides,
  };
}

describe("renderIconSvg", () => {
  it("should render document metadata in request order with repeated slugs when an SVG is generated", async () => {
    // Given
    const parsedRequest = request({
      icons: [
        icon("typescript"),
        icon("react"),
        icon("typescript"),
        icon("nextjs"),
      ],
      slugs: ["typescript", "react", "typescript", "nextjs"],
      columns: 4,
    });

    // When
    const svg = await renderIconSvg(parsedRequest);

    // Then
    expect(svg).toContain('role="img" aria-labelledby="title desc"');
    expect(svg).toContain(
      "<title id=\"title\">TypeScript, React, TypeScript, Next.js</title>",
    );
    expect(svg).toContain(
      "<desc id=\"desc\">Technology stack icons for TypeScript, React, TypeScript, Next.js.</desc>",
    );
    expect(svg.match(/#3178C6/g)).toHaveLength(2);
    expect(svg.indexOf("#3178C6")).toBeLessThan(svg.indexOf("#087EA4"));
    expect(svg.lastIndexOf("#3178C6")).toBeLessThan(svg.indexOf(":r8:mask"));
  });

  it("should compute dimensions and icon positions when columns and gap are provided", async () => {
    // Given
    const parsedRequest = request({
      icons: [
        icon("typescript"),
        icon("react"),
        icon("nextjs"),
        icon("tailwindcss"),
        icon("vercel"),
      ],
      slugs: ["typescript", "react", "nextjs", "tailwindcss", "vercel"],
      columns: 2,
      gap: 12,
    });

    // When
    const svg = await renderIconSvg(parsedRequest);

    // Then
    expect(svg).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="92" height="144" viewBox="0 0 92 144" role="img"',
    );
    expect(svg.match(/<svg x="/g)).toHaveLength(5);
    expect(svg).toContain('<svg x="0" y="0" width="40" height="40"');
    expect(svg).toContain('<svg x="52" y="0" width="40" height="40"');
    expect(svg).toContain('<svg x="0" y="52" width="40" height="40"');
    expect(svg).toContain('<svg x="52" y="52" width="40" height="40"');
    expect(svg).toContain('<svg x="0" y="104" width="40" height="40"');
  });
});
