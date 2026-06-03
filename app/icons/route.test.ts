import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/icons route", () => {
  it("should return an ordered icon grid when the icon request is valid", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript,react,typescript&columns=2&gap=12",
    );

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
    expect(body).toContain('width="92" height="92"');
    expect(body).toContain('role="img"');
    expect(body).toContain("<title id=\"title\">TypeScript, React, TypeScript</title>");
    expect(body).toContain(
      "<desc id=\"desc\">Technology stack icons for TypeScript, React, TypeScript.</desc>",
    );
    expect(body.match(/#3178C6/g)).toHaveLength(2);
    expect(body).toContain('<svg x="0" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="52" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="0" y="52" width="40" height="40"');
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

  it("should ignore the version query param when a valid icon request renders", async () => {
    // Given
    const requestWithoutVersion = new Request(
      "http://localhost/icons?icons=typescript,react&columns=2&gap=12&theme=dark",
    );
    const requestWithVersion = new Request(
      "http://localhost/icons?icons=typescript,react&columns=2&gap=12&theme=dark&v=cache-key",
    );

    // When
    const responseWithoutVersion = await GET(requestWithoutVersion);
    const responseWithVersion = await GET(requestWithVersion);
    const bodyWithoutVersion = await responseWithoutVersion.text();
    const bodyWithVersion = await responseWithVersion.text();

    // Then
    expect(responseWithVersion.status).toBe(200);
    expect(responseWithVersion.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, s-maxage=31536000, immutable",
    );
    expect(bodyWithVersion).toBe(bodyWithoutVersion);
  });
});
