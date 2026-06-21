import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from ".";

describe("SiteFooter", () => {
  it("should show the compact brand and editor link", () => {
    // Given / When
    render(<SiteFooter />);

    // Then
    expect(screen.getByText("StackIcons")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "editor" })).toHaveAttribute(
      "href",
      "/editor",
    );
  });

  it("should render as the page footer", () => {
    // Given / When
    render(<SiteFooter />);

    // Then
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
