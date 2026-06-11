import { describe, expect, it } from "vitest";

import { listIconSlugs, listRegisteredIcons } from "./registry";
import { parseIconRequest } from "./parse-request";

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("icon request parser", () => {
  it("should default to all registered icons when icon slugs are omitted", () => {
    // Given
    const searchParams = params("");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result.success ? result.data.slugs : []).toEqual(listIconSlugs());
    expect(result.success ? result.data.icons : []).toEqual(
      listRegisteredIcons(),
    );
  });

  it("should resolve all registered icons when the all value is parsed", () => {
    // Given
    const searchParams = params("icons=all");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result.success ? result.data.slugs : []).toEqual(listIconSlugs());
    expect(result.success ? result.data.icons : []).toEqual(
      listRegisteredIcons(),
    );
  });

  it("should parse comma-separated icon slugs while preserving order and repetitions", () => {
    // Given
    const searchParams = params("icons=typescript,react,typescript,nextjs");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        slugs: ["typescript", "react", "typescript", "nextjs"],
        icons: [
          { slug: "typescript", label: "TypeScript" },
          { slug: "react", label: "React" },
          { slug: "typescript", label: "TypeScript" },
          { slug: "nextjs", label: "Next.js" },
        ],
      },
    });
  });

  it("should ignore empty slug entries when accidental double commas are parsed", () => {
    // Given
    const searchParams = params("icons=typescript,,react,");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        slugs: ["typescript", "react"],
      },
    });
  });

  it("should skip unknown slugs while preserving the order of known slugs when icon input is parsed", () => {
    // Given
    const searchParams = params("icons=typescript,not-real,react");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        slugs: ["typescript", "react"],
        unknownSlugs: ["not-real"],
        icons: [
          { slug: "typescript", label: "TypeScript" },
          { slug: "react", label: "React" },
        ],
      },
    });
  });

  it("should report no unknown slugs when every parsed slug is registered", () => {
    // Given
    const searchParams = params("icons=typescript,react");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        slugs: ["typescript", "react"],
        unknownSlugs: [],
      },
    });
  });

  it("should reject the request when every parsed slug is unknown", () => {
    // Given
    const searchParams = params("icons=not-real,also-fake");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["Unknown icon slugs: not-real, also-fake."],
    });
  });

  it("should reject more than 1000 icon slugs when icon input is parsed", () => {
    // Given
    const searchParams = params(
      `icons=${Array(1001).fill("typescript").join(",")}`,
    );

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`icons` must include 1000 icons or fewer."],
    });
  });

  it("should use default layout values when optional params are omitted", () => {
    // Given
    const searchParams = params("icons=typescript");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        columns: 16,
        gap: 8,
        size: 40,
        theme: "light",
      },
    });
  });

  it("should accept valid bounds when layout params are parsed", () => {
    // Given
    const searchParams = params(
      "icons=typescript&columns=2&gap=24&size=64&theme=dark",
    );

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        columns: 2,
        gap: 24,
        size: 64,
        theme: "dark",
      },
    });
  });

  it("should default the icon size to 40 when the size param is absent", () => {
    // Given — generated image source URLs copied before the size param existed
    // must keep rendering at the pre-existing 40px icon size (ADR 0001).
    const searchParams = params("icons=typescript&columns=2&gap=12");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        size: 40,
      },
    });
  });

  it("should accept the minimum icon size when the size param is parsed", () => {
    // Given
    const searchParams = params("icons=typescript&size=24");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      data: {
        size: 24,
      },
    });
  });

  it("should reject an icon size below the minimum when the size param is parsed", () => {
    // Given
    const searchParams = params("icons=typescript&size=23");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`size` must be at least 24."],
    });
  });

  it("should reject an icon size above the maximum when the size param is parsed", () => {
    // Given
    const searchParams = params("icons=typescript&size=65");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`size` must be at most 64."],
    });
  });

  it("should reject non-integer icon sizes when the size param is parsed", () => {
    // Given
    const searchParams = params("icons=typescript&size=47.5");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`size` must be an integer."],
    });
  });

  it("should reject non-numeric icon sizes when the size param is parsed", () => {
    // Given
    const searchParams = params("icons=typescript&size=abc");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["Invalid input: expected number, received NaN"],
    });
  });

  it("should reject out-of-bounds columns when layout params are parsed", () => {
    // Given
    const searchParams = params("icons=typescript&columns=21");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`columns` must be at most 20."],
    });
  });

  it("should reject non-integer gap values when layout params are parsed", () => {
    // Given
    const searchParams = params("icons=typescript&gap=1.5");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ["`gap` must be an integer."],
    });
  });

  it("should reject unsupported themes when theme params are parsed", () => {
    // Given
    const searchParams = params("icons=typescript&theme=sepia");

    // When
    const result = parseIconRequest(searchParams);

    // Then
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: ['Invalid option: expected one of "light"|"dark"'],
    });
  });

  it("should ignore the version param when semantic request values are parsed", () => {
    // Given
    const withoutVersion = params(
      "icons=typescript&columns=4&gap=12&theme=dark",
    );
    const withVersion = params(
      "icons=typescript&columns=4&gap=12&theme=dark&v=cache-key",
    );

    // When
    const parsedWithoutVersion = parseIconRequest(withoutVersion);
    const parsedWithVersion = parseIconRequest(withVersion);

    // Then
    expect(parsedWithVersion).toEqual(parsedWithoutVersion);
  });
});
