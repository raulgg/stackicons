import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { IconThumbnail } from "./IconThumbnail";

describe("IconThumbnail", () => {
  it("should render a light and a dark image toggled by theme classes when the icon has a dark asset", () => {
    // Given / When — react has a dark asset variant in the registry
    const { container } = render(<IconThumbnail slug="react" />);

    // Then
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/icons?icons=react&theme=light");
    expect(images[0].className).toContain("dark:hidden");
    expect(images[1]).toHaveAttribute("src", "/icons?icons=react&theme=dark");
    expect(images[1].className).toContain("hidden dark:block");
  });

  it("should render a single light image when the icon has no dark asset", () => {
    // Given / When — typescript only has a light asset in the registry
    const { container } = render(<IconThumbnail slug="typescript" />);

    // Then
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute(
      "src",
      "/icons?icons=typescript&theme=light",
    );
  });

  it("should render a single light image when the slug is not in the registry", () => {
    // Given / When
    const { container } = render(<IconThumbnail slug="not-a-real-icon" />);

    // Then
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute(
      "src",
      "/icons?icons=not-a-real-icon&theme=light",
    );
  });
});
