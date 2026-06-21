import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StackIconsBrand } from "./StackIconsBrand";

describe("StackIconsBrand", () => {
  it("should show the wordmark and tagline in the full variant", () => {
    // Given / When
    render(<StackIconsBrand variant="full" />);

    // Then
    expect(
      screen.getByText((_, element) => element?.textContent === "StackIcons"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tech Stack Icons Composer")).toBeInTheDocument();
  });

  it("should show only the wordmark in the compact variant", () => {
    // Given / When
    render(<StackIconsBrand variant="compact" />);

    // Then
    expect(screen.getByText("StackIcons")).toBeInTheDocument();
    expect(
      screen.queryByText("Tech Stack Icons Composer"),
    ).not.toBeInTheDocument();
  });

  it("should render the logo as decorative", () => {
    // Given / When
    const { container } = render(<StackIconsBrand variant="full" />);

    // Then
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});
