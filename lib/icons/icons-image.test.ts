import { describe, expect, it } from "vitest";

import { generateIconsImage } from "./icons-image";

const baseInput = {
  columnLayouts: [{ columns: "4", minWidthPx: null }],
  currentOrigin: "http://localhost:3000",
  gap: "8",
  icons: "react,nextjs",
  includeDarkTheme: true,
  size: "48",
};

describe("icons image", () => {
  it("should generate single layout icons image code with generated icons images", () => {
    expect(generateIconsImage(baseInput)).toEqual({
      success: true,
      unknownSlugs: [],
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=light",
        },
        {
          columns: 4,
          minWidthPx: null,
          theme: "dark",
          url: "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=dark",
        },
      ],
      iconsImageCode: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should generate single layout icons image code without dark generated icons images", () => {
    expect(
      generateIconsImage({
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
          url: "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=light",
        },
      ],
      iconsImageCode: `<picture>
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should generate only icons image code sources when dark sources are excluded", () => {
    const result = generateIconsImage({
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
      ],
      includeDarkTheme: false,
    });

    expect(result).toMatchObject({
      success: true,
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=light",
        },
        {
          columns: 8,
          minWidthPx: 640,
          theme: "light",
          url: "http://localhost:3000/icons?s=react%2Cnextjs&cols=8&gap=8&size=48&theme=light",
        },
      ],
      iconsImageCode: `<picture>
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
    expect(result.success ? result.imageSources : []).not.toContainEqual(
      expect.objectContaining({ theme: "dark" }),
    );
  });

  it("should generate responsive sources from widest breakpoint to narrowest in icons image code", () => {
    const result = generateIconsImage({
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
        { columns: "12", minWidthPx: "1024" },
      ],
      gap: "10",
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
    expect(result.success ? result.iconsImageCode : "").toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=12&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=12&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=10&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=10&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should return a validation error when a non-registered value like 'all' is provided (no magic support)", () => {
    const result = generateIconsImage({
      ...baseInput,
      icons: "all",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["Unknown icon slug: all."],
    });
  });

  it("should escape query separators inside generated icons image code", () => {
    const result = generateIconsImage(baseInput);

    expect(result.success ? result.iconsImageCode : "").not.toContain("&cols=");
    expect(result.success ? result.iconsImageCode : "").toContain("&amp;cols=");
  });

  it("should emit the icon size in every generated icons image URL when icons image code is generated", () => {
    // Given
    const input = {
      ...baseInput,
      columnLayouts: [
        { columns: "4", minWidthPx: null },
        { columns: "8", minWidthPx: "640" },
      ],

      size: "56",
    };

    // When
    const result = generateIconsImage(input);

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
    const result = generateIconsImage(baseInput);

    // Then
    expect(result.success ? result.iconsImageCode : "").not.toContain(
      'width="',
    );
  });

  it("should return a validation error when the icon size is out of range", () => {
    expect(
      generateIconsImage({
        ...baseInput,
        size: "100",
      }),
    ).toEqual({
      success: false,
      errors: ["`size` must be at most 64."],
    });
  });

  it("should carry unknown slugs in generated icons image URLs while labeling only known icons", () => {
    // Given
    const input = {
      ...baseInput,
      icons: "react,not-real,nextjs",
    };

    // When
    const result = generateIconsImage(input);

    // Then
    expect(result).toEqual({
      success: true,
      unknownSlugs: ["not-real"],
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?s=react%2Cnot-real%2Cnextjs&cols=4&gap=8&size=48&theme=light",
        },
        {
          columns: 4,
          minWidthPx: null,
          theme: "dark",
          url: "http://localhost:3000/icons?s=react%2Cnot-real%2Cnextjs&cols=4&gap=8&size=48&theme=dark",
        },
      ],
      iconsImageCode: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnot-real%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnot-real%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`,
    });
  });

  it("should return validation errors when every icon slug is unknown", () => {
    expect(
      generateIconsImage({
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
      generateIconsImage({
        ...baseInput,
        currentOrigin: "",
      }),
    ).toEqual({
      success: false,
      errors: [],
    });
  });
});
