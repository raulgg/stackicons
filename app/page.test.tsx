import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/ThemeProvider";

import Home from "./page";

describe("Home", () => {
  it("should render the hero heading when the landing page renders", () => {
    // Given / When
    render(
      <ThemeProvider>
        <Home />
      </ThemeProvider>,
    );

    // Then
    expect(
      screen.getByRole("heading", { level: 1, name: "Show off your stack." }),
    ).toBeInTheDocument();
  });

  it("should link to the editor when the landing page renders", () => {
    // Given / When
    render(
      <ThemeProvider>
        <Home />
      </ThemeProvider>,
    );

    // Then
    const editorLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/editor");
    expect(editorLinks.length).toBeGreaterThan(0);
  });
});
