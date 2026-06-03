import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/icons route", () => {
  it("should return one inlined light SVG icon when the icon request is valid", async () => {
    // Given
    const request = new Request("http://localhost/icons?icons=typescript");

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, s-maxage=31536000, immutable",
    );
    expect(body).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(body).toContain('width="40" height="40"');
    expect(body).toContain("<desc id=\"desc\">TypeScript</desc>");
    expect(body).toContain("README Stack Icons");
    expect(body).toContain("#3178C6");
    expect(body).not.toContain("<image");
    expect(body).not.toMatch(/\bsrc=/);
    expect(body).not.toMatch(/\bhref=["'](?!#)/);
  });

  it("should return an SVG error image when the icon request is invalid", async () => {
    // Given
    const request = new Request("http://localhost/icons?icons=not-real");

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toContain("<svg");
    expect(body).toContain("Invalid icon request");
    expect(body).toContain("Unknown icon slug: not-real.");
    expect(body).not.toMatch(/\b(?:href|src)=/);
  });
});
