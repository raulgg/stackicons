import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { UiThemeMenu } from "./UiThemeMenu";

function renderUiThemeMenu() {
  render(
    <ThemeProvider>
      <UiThemeMenu />
    </ThemeProvider>,
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "UI theme" }));
}

function getMenuItem(name: "Light" | "Dark" | "System") {
  return screen.getByRole("menuitemradio", { name });
}

describe("UiThemeMenu", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.removeAttribute("style");
    window.localStorage.clear();
  });

  it("should show the Light, Dark, and System options when the trigger is clicked", () => {
    // Given
    renderUiThemeMenu();

    // When
    openMenu();

    // Then
    expect(getMenuItem("Light")).toBeInTheDocument();
    expect(getMenuItem("Dark")).toBeInTheDocument();
    expect(getMenuItem("System")).toBeInTheDocument();
  });

  it("should check the System option when no theme preference is stored", async () => {
    // Given — fresh visitor, nothing in localStorage
    renderUiThemeMenu();

    // When
    openMenu();

    // Then
    await waitFor(() => {
      expect(getMenuItem("System")).toHaveAttribute("aria-checked", "true");
    });
    expect(getMenuItem("Light")).toHaveAttribute("aria-checked", "false");
    expect(getMenuItem("Dark")).toHaveAttribute("aria-checked", "false");
  });

  it("should apply the dark theme to the page when the Dark option is selected", async () => {
    // Given
    renderUiThemeMenu();
    openMenu();

    // When
    fireEvent.click(getMenuItem("Dark"));

    // Then
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("should persist the preference when the Dark option is selected", async () => {
    // Given
    renderUiThemeMenu();
    openMenu();

    // When
    fireEvent.click(getMenuItem("Dark"));

    // Then
    await waitFor(() => {
      expect(window.localStorage.getItem("theme")).toBe("dark");
    });
  });

  it("should persist the system preference when System is selected after a static theme", async () => {
    // Given — user previously pinned dark
    renderUiThemeMenu();
    openMenu();
    fireEvent.click(getMenuItem("Dark"));
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });

    // When
    openMenu();
    fireEvent.click(getMenuItem("System"));

    // Then — OS reports light (matchMedia shim matches: false)
    await waitFor(() => {
      expect(window.localStorage.getItem("theme")).toBe("system");
    });
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  it("should close the menu when an option is selected", async () => {
    // Given
    renderUiThemeMenu();
    openMenu();

    // When
    fireEvent.click(getMenuItem("Light"));

    // Then
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("should close the menu when Escape is pressed", async () => {
    // Given
    renderUiThemeMenu();
    openMenu();

    // When
    fireEvent.keyDown(getMenuItem("Light"), { key: "Escape" });

    // Then
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
