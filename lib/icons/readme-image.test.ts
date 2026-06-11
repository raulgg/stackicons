import { describe, expect, it } from "vitest";

import { generateReadmeImage } from "./readme-image";

const baseInput = {
  columnLayouts: [{ columns: "4", minWidthPx: null }],
  currentOrigin: "http://localhost:3000",
  gap: "8",
  icons: "react,nextjs",
  includeDarkTheme: true,
  layoutMode: "single" as const,
  size: "48",
};

describe("README image", () => {
  it("should generate single layout README image code with generated image sources", () => {
    expect(generateReadmeImage(baseInput)).toEqual({
      success: true,
      unknownSlugs: [],
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=light",
        },
        {
          columns: 4,
          minWidthPx: null,
          theme: "dark",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=dark",
        },
      ],
      readmeHtml: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should generate single layout README image code without dark generated image sources", () => {
    expect(
      generateReadmeImage({
        ...baseInput,
        includeDarkTheme: false,
      }),
    ).toEqual({
      success: true,
      unknownSlugs: [],
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=light",
        },
      ],
      readmeHtml: `<picture>
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should generate only README image code sources when dark sources are excluded", () => {
    const result = generateReadmeImage({
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
      ],
      includeDarkTheme: false,
      layoutMode: "responsive",
    });

    expect(result).toMatchObject({
      success: true,
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=light",
        },
        {
          columns: 8,
          minWidthPx: 640,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=8&gap=8&size=48&theme=light",
        },
      ],
      readmeHtml: `<picture>
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
    expect(result.success ? result.imageSources : []).not.toContainEqual(
      expect.objectContaining({ theme: "dark" }),
    );
  });

  it("should generate responsive sources from widest breakpoint to narrowest in README image code", () => {
    const result = generateReadmeImage({
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
        { columns: "12", minWidthPx: "1024" },
      ],
      gap: "10",
      layoutMode: "responsive",
    });

    expect(result).toMatchObject({
      success: true,
      imageSources: [
        { columns: 4, minWidthPx: null, theme: "light" },
        { columns: 4, minWidthPx: null, theme: "dark" },
        { columns: 8, minWidthPx: 640, theme: "light" },
        { columns: 8, minWidthPx: 640, theme: "dark" },
        { columns: 12, minWidthPx: 1024, theme: "light" },
        { columns: 12, minWidthPx: 1024, theme: "dark" },
      ],
    });
    expect(result.success ? result.readmeHtml : "").toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should omit the icons query param for explicit all icons", () => {
    const result = generateReadmeImage({
      ...baseInput,
      icons: "all",
    });

    expect(result.success ? result.imageSources : []).toEqual([
      {
        columns: 4,
        minWidthPx: null,
        theme: "light",
        url: "http://localhost:3000/icons?columns=4&gap=8&size=48&theme=light",
      },
      {
        columns: 4,
        minWidthPx: null,
        theme: "dark",
        url: "http://localhost:3000/icons?columns=4&gap=8&size=48&theme=dark",
      },
    ]);
    expect(result.success ? result.readmeHtml : "").toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="All stack icons" title="All stack icons" />
</picture>`);
  });

  it("should escape query separators inside generated README image code", () => {
    const result = generateReadmeImage(baseInput);

    expect(result.success ? result.readmeHtml : "").not.toContain("&columns=");
    expect(result.success ? result.readmeHtml : "").toContain("&amp;columns=");
  });

  it("should emit the icon size in every generated image source URL when README image code is generated", () => {
    // Given
    const input = {
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
      ],
      layoutMode: "responsive" as const,
      size: "56",
    };

    // When
    const result = generateReadmeImage(input);

    // Then
    expect(result.success).toBe(true);
    const imageSources = result.success ? result.imageSources : [];
    expect(imageSources).toHaveLength(4);
    for (const imageSource of imageSources) {
      expect(imageSource.url).toContain("size=56");
    }
  });

  it("should omit the width attribute when the fallback img is generated", () => {
    // Given / When
    const result = generateReadmeImage(baseInput);

    // Then
    expect(result.success ? result.readmeHtml : "").not.toContain('width="');
  });

  it("should return a validation error when the icon size is out of range", () => {
    expect(
      generateReadmeImage({
        ...baseInput,
        size: "100",
      }),
    ).toEqual({
      success: false,
      errors: ["`size` must be at most 64."],
    });
  });

  it("should carry unknown slugs in generated image source URLs while labeling only known icons", () => {
    // Given
    const input = {
      ...baseInput,
      icons: "react,not-real,nextjs",
    };

    // When
    const result = generateReadmeImage(input);

    // Then
    expect(result).toEqual({
      success: true,
      unknownSlugs: ["not-real"],
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnot-real%2Cnextjs&columns=4&gap=8&size=48&theme=light",
        },
        {
          columns: 4,
          minWidthPx: null,
          theme: "dark",
          url: "http://localhost:3000/icons?icons=react%2Cnot-real%2Cnextjs&columns=4&gap=8&size=48&theme=dark",
        },
      ],
      readmeHtml: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnot-real%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnot-real%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should return validation errors when every icon slug is unknown", () => {
    expect(
      generateReadmeImage({
        ...baseInput,
        columnLayouts: [{ columns: "1", minWidthPx: null }],
        icons: "not-real",
      }),
    ).toEqual({
      success: false,
      errors: [
        "Unknown icon slug: not-real.",
        "Each column layout must use 2 to 20 columns.",
      ],
    });
  });

  it("should return empty errors when the origin is not available", () => {
    expect(
      generateReadmeImage({
        ...baseInput,
        currentOrigin: "",
      }),
    ).toEqual({
      success: false,
      errors: [],
    });
  });
});
