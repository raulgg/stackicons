import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderThemeToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

function getLightButton() {
  return screen.getByRole("button", { name: "Light" });
}

function getDarkButton() {
  return screen.getByRole("button", { name: "Dark" });
}

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.removeAttribute("style");
    window.localStorage.clear();
  });

  it("should press the Light button when no theme is stored and the OS reports light", async () => {
    // Given — no stored theme, OS reports light (matchMedia shim matches: false)
    renderThemeToggle();

    // When — mounting resolves the system theme (render is the action)

    // Then
    await waitFor(() => {
      expect(getLightButton()).toHaveAttribute("aria-pressed", "true");
    });
    expect(getDarkButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("should apply the dark theme to the page when the Dark button is clicked", async () => {
    // Given
    renderThemeToggle();

    // When
    fireEvent.click(getDarkButton());

    // Then
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
    await waitFor(() => {
      expect(getDarkButton()).toHaveAttribute("aria-pressed", "true");
    });
    expect(getLightButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("should persist the selected theme when the Dark button is clicked", async () => {
    // Given
    renderThemeToggle();

    // When
    fireEvent.click(getDarkButton());

    // Then
    await waitFor(() => {
      expect(window.localStorage.getItem("theme")).toBe("dark");
    });
  });

  it("should return to the light theme when the Light button is clicked after dark", async () => {
    // Given
    renderThemeToggle();
    fireEvent.click(getDarkButton());
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });

    // When
    fireEvent.click(getLightButton());

    // Then
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
    });
    await waitFor(() => {
      expect(getLightButton()).toHaveAttribute("aria-pressed", "true");
    });
  });
});
