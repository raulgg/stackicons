import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StackIconsEditor } from ".";
import {
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  getStackIconsEditorInitialState,
} from "./state";

function setLocation(url: string) {
  window.history.replaceState(null, "", url);
}

describe("StackIconsEditor", () => {
  beforeEach(() => {
    setLocation("/");
  });

  it("should reflect raw form state in the page query when fields change", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
    expect(
      screen.queryByRole("img", { name: "Generated stack icons preview" }),
    ).not.toBeInTheDocument();

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "12" },
    });

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("icons")).toBe("react,nextjs");
      expect(params.get("columns")).toBe("4");
      expect(params.get("gap")).toBe("12");
      expect(params.get("include-dark-theme")).toBe("true");
      expect(params.has("baseUrl")).toBe(false);
      expect(params.has("v")).toBe(false);
    });
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should preserve raw state when rendered with page query params", async () => {
    // Given
    setLocation(
      "/?icons=solid%2Ctypescript&columns=6&gap=10&v=rev-2&baseUrl=https%3A%2F%2Fcdn.example",
    );

    // When
    render(
      <StackIconsEditor
        initialState={getStackIconsEditorInitialState({
          baseUrl: "https://cdn.example",
          columns: "6",
          gap: "10",
          icons: "solid,typescript",
          v: "rev-2",
        })}
      />,
    );

    // Then
    expect(await screen.findByDisplayValue("solid,typescript")).toBe(
      screen.getByLabelText("Icon slugs"),
    );
    expect(screen.getByLabelText("Icon slugs")).toHaveValue("solid,typescript");
    expect(screen.getByLabelText("Columns")).toHaveValue(6);
    expect(screen.getByLabelText("Gap")).toHaveValue(10);
    expect(screen.getByLabelText("Include dark theme source")).toBeChecked();
    expect(screen.queryByLabelText("Base URL")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Version")).not.toBeInTheDocument();
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
  });

  it("should show validation errors when the icons field is empty", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("icons")).toBe("");
    });
    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "`icons` must include at least one icon slug.",
    );
  });

  it("should generate README HTML with dark source by default", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "8" },
    });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const readmeHtml = screen.getByLabelText("README HTML");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="88" height="40" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "loading=",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "decoding=",
    );
  });

  it("should generate README HTML without dark sources when dark theme is disabled", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByLabelText("Include dark theme source"));

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const readmeHtml = screen.getByLabelText("README HTML");

    expect(readmeHtml).toHaveValue(`<picture>
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="88" height="40" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "<source",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "theme=dark",
    );
  });

  it("should generate basic README HTML without icons param for explicit all icons", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "all" },
    });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const readmeHtml = screen.getByLabelText("README HTML");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=16&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=16&amp;gap=8&amp;theme=light" alt="All stack icons" title="All stack icons" width="760" height="184" />
</picture>`);
  });

  it("should preserve README HTML URL param order and escape attribute separators", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "typescript,react,nextjs" },
    });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=16&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=16&amp;gap=8&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" width="136" height="40" />
</picture>`);
  });

  it("should render a preview with the generated icons URL after explicit generation", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "12" },
    });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const expectedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=12";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(expectedUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", expectedUrl);
  });

  it("should show validation errors when generated input is invalid", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "typescript,not-real" },
    });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unknown icon slug: not-real.",
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(
      screen.queryByRole("img", { name: "Generated stack icons preview" }),
    ).not.toBeInTheDocument();
  });

  it("should not refresh the generated preview when form fields are edited", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    const generatedUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=16&gap=8";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(generatedUrl);

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });

    // Then
    expect(screen.getByLabelText("SVG URL")).toHaveValue(generatedUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", generatedUrl);
  });

  it("should not use localStorage when editor state changes", () => {
    // Given
    const getItem = vi.spyOn(window.localStorage.__proto__, "getItem");
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem");

    // When
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });

    // Then
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("should derive initial editor state when page query params are parsed", () => {
    // Given
    const searchParams = {
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
      includeDarkTheme: true,
    });
  });

  it("should derive disabled dark theme state when page query params are parsed", () => {
    // Given
    const searchParams = {
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
      "include-dark-theme": "false",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
      includeDarkTheme: false,
    });
  });
});
