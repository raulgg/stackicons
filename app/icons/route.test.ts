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
    expect(body).toContain(
      '<title id="title">TypeScript, React, TypeScript</title>',
    );
    expect(body).toContain(
      '<desc id="desc">Technology stack icons for TypeScript, React, TypeScript.</desc>',
    );
    expect(body.match(/#3178C6/g)).toHaveLength(2);
    expect(body).toContain('<svg x="0" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="52" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="0" y="52" width="40" height="40"');
    expect(body).not.toContain("<image");
    expect(body).not.toMatch(/\bsrc=/);
    expect(body).not.toMatch(/\bhref=["'](?!#)/);
  });

  it("should render icons at the requested size when a valid size param is provided", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript,react,typescript&columns=2&gap=12&size=56",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(200);
    expect(body).toContain('width="124" height="124"');
    expect(body).toContain('<svg x="0" y="0" width="56" height="56"');
    expect(body).toContain('<svg x="68" y="0" width="56" height="56"');
    expect(body).toContain('<svg x="0" y="68" width="56" height="56"');
  });

  it("should render icons at 40px when the size param is absent", async () => {
    // Given — README image code copied before the size param existed (ADR 0001)
    const request = new Request(
      "http://localhost/icons?icons=typescript,react&columns=2&gap=12",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(200);
    expect(body).toContain('width="92" height="40"');
    expect(body).toContain('<svg x="0" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="52" y="0" width="40" height="40"');
  });

  it("should return an SVG error image when the size param is below the minimum", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript&size=23",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body).toContain("Invalid icon request");
    expect(body).toContain("`size` must be at least 24.");
  });

  it("should return an SVG error image when the size param is above the maximum", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript&size=65",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body).toContain("Invalid icon request");
    expect(body).toContain("`size` must be at most 64.");
  });

  it("should return an SVG error image when the size param is not numeric", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript&size=abc",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body).toContain("Invalid icon request");
  });

  it("should skip unknown slugs and render the remaining icons in order when known slugs remain", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=typescript,not-real,react&columns=2&gap=12",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body).toContain('<title id="title">TypeScript, React</title>');
    expect(body).not.toContain("not-real");
    expect(body).not.toContain("Invalid icon request");
    expect(body).toContain('<svg x="0" y="0" width="40" height="40"');
    expect(body).toContain('<svg x="52" y="0" width="40" height="40"');
    expect(body).not.toContain('<svg x="0" y="52"');
  });

  it("should return an SVG error image when every icon slug is unknown", async () => {
    // Given
    const request = new Request(
      "http://localhost/icons?icons=not-real,also-fake",
    );

    // When
    const response = await GET(request);
    const body = await response.text();

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toContain("<svg");
    expect(body).toContain("Invalid icon request");
    expect(body).toContain("Unknown icon slugs: not-real, also-fake.");
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
