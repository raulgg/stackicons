import { describe, expect, it } from "vitest";

import { buildReadmeEmbedHtml } from "./readme-embed";

const baseInput = {
  columnLayouts: [{ columns: "4", minWidthPx: null }],
  currentOrigin: "http://localhost:3000",
  gap: "8",
  icons: "react,nextjs",
  includeDarkTheme: true,
  layoutMode: "single" as const,
};

describe("README embed", () => {
  it("should build single layout README HTML with a dark theme source", () => {
    expect(buildReadmeEmbedHtml(baseInput)).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should build single layout README HTML without dark theme sources", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        includeDarkTheme: false,
      }),
    ).toBe(`<picture>
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should build responsive sources from widest breakpoint to narrowest", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        columnLayouts: [
          { columns: "4", minWidthPx: null },
          { columns: "8", minWidthPx: "640" },
          { columns: "12", minWidthPx: "1024" },
        ],
        gap: "10",
        layoutMode: "responsive",
      }),
    ).toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should omit the icons query param for explicit all icons", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        icons: "all",
      }),
    ).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=4&amp;gap=8&amp;theme=light" alt="All stack icons" title="All stack icons" width="100%" />
</picture>`);
  });

  it("should escape query separators inside generated srcset and src values", () => {
    expect(buildReadmeEmbedHtml(baseInput)).not.toContain("&columns=");
    expect(buildReadmeEmbedHtml(baseInput)).toContain("&amp;columns=");
  });

  it("should return empty HTML when icon slugs are invalid", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        icons: "not-real",
      }),
    ).toBe("");
  });

  it("should return empty HTML when column layouts are invalid", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        columnLayouts: [{ columns: "1", minWidthPx: null }],
      }),
    ).toBe("");
  });

  it("should return empty HTML when the origin is not available", () => {
    expect(
      buildReadmeEmbedHtml({
        ...baseInput,
        currentOrigin: "",
      }),
    ).toBe("");
  });
});
