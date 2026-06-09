import { describe, expect, it } from "vitest";

import { generateReadmeImage } from "./readme-image";

const baseInput = {
  columnLayouts: [{ columns: "4", minWidthPx: null }],
  currentOrigin: "http://localhost:3000",
  gap: "8",
  icons: "react,nextjs",
  includeDarkTheme: true,
  layoutMode: "single" as const,
};

describe("README image", () => {
  it("should generate single layout README image code with generated image sources", () => {
    expect(generateReadmeImage(baseInput)).toEqual({
      success: true,
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=light",
        },
        {
          columns: 4,
          minWidthPx: null,
          theme: "dark",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=dark",
        },
      ],
      readmeHtml: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
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
      imageSources: [
        {
          columns: 4,
          minWidthPx: null,
          theme: "light",
          url: "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=light",
        },
      ],
      readmeHtml: `<picture>
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`,
    });
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
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
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
        url: "http://localhost:3000/icons?columns=4&gap=8&theme=light",
      },
      {
        columns: 4,
        minWidthPx: null,
        theme: "dark",
        url: "http://localhost:3000/icons?columns=4&gap=8&theme=dark",
      },
    ]);
    expect(result.success ? result.readmeHtml : "").toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=4&amp;gap=8&amp;theme=light" alt="All stack icons" title="All stack icons" width="100%" />
</picture>`);
  });

  it("should escape query separators inside generated README image code", () => {
    const result = generateReadmeImage(baseInput);

    expect(result.success ? result.readmeHtml : "").not.toContain("&columns=");
    expect(result.success ? result.readmeHtml : "").toContain("&amp;columns=");
  });

  it("should return all relevant validation errors", () => {
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
