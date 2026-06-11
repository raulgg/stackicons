import { describe, expect, it } from "vitest";

import { getIconBySlug } from "./registry";
import { renderIconRequestErrorSvg, renderIconSvg } from "./render-svg";
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
    unknownSlugs: [],
    columns: 16,
    gap: 8,
    size: 40,
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
      '<title id="title">TypeScript, React, TypeScript, Next.js</title>',
    );
    expect(svg).toContain(
      '<desc id="desc">Technology stack icons for TypeScript, React, TypeScript, Next.js.</desc>',
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

  it("should scale grid dimensions and icon placements when a custom icon size is requested", async () => {
    // Given
    const parsedRequest = request({
      icons: [icon("typescript"), icon("react"), icon("nextjs")],
      slugs: ["typescript", "react", "nextjs"],
      columns: 2,
      gap: 8,
      size: 56,
    });

    // When
    const svg = await renderIconSvg(parsedRequest);

    // Then
    expect(svg).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img"',
    );
    expect(svg).toContain('<svg x="0" y="0" width="56" height="56"');
    expect(svg).toContain('<svg x="64" y="0" width="56" height="56"');
    expect(svg).toContain('<svg x="0" y="64" width="56" height="56"');
  });

  it("should use light assets for icons with dark variants when a light SVG is generated", async () => {
    // Given
    const parsedRequest = request({
      icons: [icon("react")],
      slugs: ["react"],
      theme: "light",
    });

    // When
    const svg = await renderIconSvg(parsedRequest);

    // Then
    expect(svg).toContain("#087EA4");
    expect(svg).not.toContain("#58C4DC");
  });

  it("should use dark assets with light fallbacks when a dark SVG is generated", async () => {
    // Given
    const parsedRequest = request({
      icons: [icon("react"), icon("typescript")],
      slugs: ["react", "typescript"],
      columns: 2,
      theme: "dark",
    });

    // When
    const svg = await renderIconSvg(parsedRequest);

    // Then
    expect(svg).toContain("#58C4DC");
    expect(svg).not.toContain("#087EA4");
    expect(svg).toContain("#3178C6");
  });

  it("should render readable SVG error text when validation errors are provided", () => {
    // Given
    const errors = ["Unknown icon slug: not-real."];

    // When
    const svg = renderIconRequestErrorSvg(errors);

    // Then
    expect(svg).toContain("<svg");
    expect(svg).toContain("Invalid icon request");
    expect(svg).toContain("Unknown icon slug: not-real.");
    expect(svg).toContain('role="img"');
  });

  it("should escape validation error text when XML-sensitive characters are provided", () => {
    // Given
    const errors = ['Unknown icon slug: <script>&"bad".'];

    // When
    const svg = renderIconRequestErrorSvg(errors);

    // Then
    expect(svg).toContain("&lt;script&gt;&amp;&quot;bad&quot;.");
    expect(svg).not.toContain('<script>&"bad"');
  });

  it("should truncate long visible error text while preserving the full accessible description", () => {
    // Given
    const errors = [
      "Unknown icon slugs: rendeeer, liiinear, fiiigma, fuuuuuge, heyyouu, 123456789.",
    ];

    // When
    const svg = renderIconRequestErrorSvg(errors);

    // Then
    expect(svg).toContain(
      '<desc id="desc">Unknown icon slugs: rendeeer, liiinear, fiiigma, fuuuuuge, heyyouu, 123456789.</desc>',
    );
    expect(svg).toContain(
      ">Unknown icon slugs: rendeeer, liiinear, fiiigma, fuuuuuge...</text>",
    );
  });
});
