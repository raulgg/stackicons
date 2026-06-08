import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StackIconsEditor } from ".";
import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  getStackIconsEditorInitialState,
} from "./state";

function setLocation(url: string) {
  window.history.replaceState(null, "", url);
}

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText,
    },
  });
}

function renderEditor() {
  render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
}

function generatePreview() {
  fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
}

describe("StackIconsEditor", () => {
  beforeEach(() => {
    setLocation("/");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
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
      expect(params.get("layout")).toBe("single");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([{ columns: "4", minWidthPx: null }]),
      );
      expect(params.get("gap")).toBe("12");
      expect(params.get("include-dark-theme")).toBe("true");
      expect(params.get("preview-theme")).toBe("light");
      expect(params.has("columns")).toBe(false);
      expect(params.has("responsive")).toBe(false);
      expect(params.has("mobile-columns")).toBe(false);
      expect(params.has("baseUrl")).toBe(false);
      expect(params.has("v")).toBe(false);
    });
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should preserve raw state when rendered with page query params", async () => {
    // Given
    setLocation(
      "/?icons=solid%2Ctypescript&layout=single&column-layouts=%5B%7B%22columns%22%3A%226%22%2C%22minWidthPx%22%3Anull%7D%5D&gap=10&v=rev-2&baseUrl=https%3A%2F%2Fcdn.example",
    );

    // When
    render(
      <StackIconsEditor
        initialState={getStackIconsEditorInitialState({
          baseUrl: "https://cdn.example",
          "column-layouts": JSON.stringify([
            { columns: "6", minWidthPx: null },
          ]),
          gap: "10",
          icons: "solid,typescript",
          layout: "single",
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
    expect(screen.getByLabelText("Light")).toBeChecked();
    expect(screen.getByLabelText("Dark")).not.toBeChecked();
    expect(screen.getByLabelText("Columns")).toBeEnabled();
    expect(screen.getByLabelText("Single layout")).toBeChecked();
    expect(screen.getByLabelText("Responsive layout")).not.toBeChecked();
    expect(
      screen.queryByLabelText("Include responsive sources"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mobile columns")).not.toBeInTheDocument();
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
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "loading=",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "decoding=",
    );
  });

  it("should show the Copy HTML button only after README HTML is generated", () => {
    // Given
    renderEditor();

    // Then
    expect(
      screen.queryByRole("button", { name: "Copy HTML" }),
    ).not.toBeInTheDocument();

    // When
    generatePreview();

    // Then
    expect(screen.getByRole("button", { name: "Copy HTML" })).toBeEnabled();
  });

  it("should copy generated README HTML exactly as displayed", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "8" },
    });
    generatePreview();

    const readmeHtml = screen.getByLabelText("README HTML");

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        (readmeHtml as HTMLTextAreaElement).value,
      );
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText("HTML copied.")).toBeInTheDocument();
    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should show copy failure feedback when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    const readmeHtml = screen.getByLabelText("README HTML");

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));

    // Then
    await waitFor(() => {
      expect(screen.getByText("Could not copy HTML.")).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledWith(
      (readmeHtml as HTMLTextAreaElement).value,
    );
  });

  it("should reset stale copy feedback after regenerating README HTML", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));
    await screen.findByText("HTML copied.");

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    generatePreview();

    // Then
    expect(screen.queryByText("HTML copied.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=light" alt="React" title="React" width="100%" />
</picture>`);
  });

  it("should ignore stale copy feedback when copy finishes after regenerating README HTML", async () => {
    // Given
    let resolveWriteText: () => void = () => {};
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWriteText = resolve;
        }),
    );
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    generatePreview();
    await React.act(async () => {
      resolveWriteText();
    });

    // Then
    expect(screen.queryByText("HTML copied.")).not.toBeInTheDocument();
    expect(screen.queryByText("Could not copy HTML.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=light" alt="React" title="React" width="100%" />
</picture>`);
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
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "<source",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "theme=dark",
    );
  });

  it("should generate responsive README HTML with dark breakpoint sources before light sources", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
            { columns: "12", minWidthPx: "1024" },
          ],
          gap: "10",
          icons: "react,nextjs",
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should generate responsive README HTML without dark sources when dark theme is disabled", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
          icons: "react,nextjs",
          includeDarkTheme: false,
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    const readmeHtml = screen.getByLabelText("README HTML");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;theme=light" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "theme=dark",
    );
  });

  it("should sort responsive README breakpoint sources by descending min width", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
            { columns: "16", minWidthPx: "1440" },
            { columns: "12", minWidthPx: "1024" },
          ],
          includeDarkTheme: false,
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    const value = (screen.getByLabelText("README HTML") as HTMLTextAreaElement)
      .value;

    expect(value.indexOf("(min-width: 1440px)")).toBeLessThan(
      value.indexOf("(min-width: 1024px)"),
    );
    expect(value.indexOf("(min-width: 1024px)")).toBeLessThan(
      value.indexOf("(min-width: 640px)"),
    );
  });

  it("should normalize valid responsive layouts before generating README HTML", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: "1024" },
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
          includeDarkTheme: false,
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&theme=light",
    );
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;theme=light" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;theme=light" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" width="100%" />
</picture>`);
  });

  it("should use the base responsive layout for the SVG URL and preview image", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "12", minWidthPx: "1024" },
          ],
          icons: "react,nextjs",
          layoutMode: "responsive",
          previewTheme: "dark",
        }}
      />,
    );

    generatePreview();

    const expectedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=dark";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(expectedUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", expectedUrl);
  });

  it("should reject duplicate responsive breakpoint min widths", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
            { columns: "12", minWidthPx: "640" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Breakpoint min width values must be unique.",
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should reject invalid responsive breakpoint min width on generation", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "0" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Breakpoint min width must be an integer from 1 to 3840.",
    );
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should reject invalid column layout columns on generation", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "21", minWidthPx: "640" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Each column layout must use 2 to 20 columns.",
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should reject missing base layout in single mode on generation", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [{ columns: "4", minWidthPx: "640" }],
        }}
      />,
    );

    generatePreview();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Exactly one base column layout is required.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Single layout mode must have exactly one base layout.",
    );
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
  });

  it("should clear stale generated output when column layout generation fails", () => {
    renderEditor();
    generatePreview();

    expect(screen.getByLabelText("SVG URL")).not.toHaveValue("");
    expect(screen.getByLabelText("README HTML")).not.toHaveValue("");

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "1" },
    });
    generatePreview();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Each column layout must use 2 to 20 columns.",
    );
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
    expect(screen.getByLabelText("README HTML")).toHaveValue("");
    expect(
      screen.queryByRole("img", { name: "Generated stack icons preview" }),
    ).not.toBeInTheDocument();
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
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=18&amp;gap=8&amp;theme=light" alt="All stack icons" title="All stack icons" width="100%" />
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
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=18&amp;gap=8&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" width="100%" />
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
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=12&theme=light";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(expectedUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", expectedUrl);
  });

  it("should use the selected dark theme for the preview URL only", () => {
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
    fireEvent.click(screen.getByLabelText("Dark"));

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const previewUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=dark";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(previewUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", previewUrl);
    expect(screen.getByLabelText("Include dark theme source")).toBeChecked();
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should keep preview theme and include dark theme settings independent", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // When
    fireEvent.click(screen.getByLabelText("Dark"));
    fireEvent.click(screen.getByLabelText("Include dark theme source"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const previewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark";

    expect(screen.getByLabelText("Dark")).toBeChecked();
    expect(screen.getByLabelText("Include dark theme source")).not.toBeChecked();
    expect(screen.getByLabelText("SVG URL")).toHaveValue(previewUrl);
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=18&amp;gap=8&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" width="100%" />
</picture>`);
  });

  it("should refresh the generated preview when the preview theme changes", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    const lightPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light";
    const darkPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark";

    expect(screen.getByLabelText("SVG URL")).toHaveValue(lightPreviewUrl);

    // When
    fireEvent.click(screen.getByLabelText("Dark"));

    // Then
    expect(screen.getByLabelText("SVG URL")).toHaveValue(darkPreviewUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", darkPreviewUrl);

    // When
    fireEvent.click(screen.getByLabelText("Light"));

    // Then
    expect(screen.getByLabelText("SVG URL")).toHaveValue(lightPreviewUrl);
    expect(
      screen.getByRole("img", { name: "Generated stack icons preview" }),
    ).toHaveAttribute("src", lightPreviewUrl);
  });

  it("should use a dark preview box background when dark preview theme is selected", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    const previewBox = screen.getByTestId("preview-box");

    expect(previewBox).toHaveClass("bg-background");
    expect(previewBox).not.toHaveClass("bg-[#0d1117]");

    // When
    fireEvent.click(screen.getByLabelText("Dark"));

    // Then
    expect(previewBox).toHaveClass("bg-[#0d1117]");
    expect(previewBox).not.toHaveClass("bg-background");
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

  it("should not show validation errors until preview generation is attempted", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "not-real" },
    });

    // Then
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("SVG URL")).toHaveValue("");
  });

  it("should clear stale validation errors after successful preview generation", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "not-real" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unknown icon slug: not-real.",
    );

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=react&columns=18&gap=8&theme=light",
    );
  });

  it("should not refresh the generated preview when edit form fields are changed", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    const generatedUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light";

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

  it("should switch to the default responsive column layouts", async () => {
    renderEditor();

    fireEvent.click(screen.getByLabelText("Responsive layout"));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("responsive");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS),
      );
    });
    expect(screen.getByLabelText("Responsive layout")).toBeChecked();
    expect(screen.getByLabelText("Mobile columns")).toHaveValue(12);
    expect(screen.getByLabelText("Columns")).toHaveValue(18);
    expect(screen.getByLabelText("Breakpoint px")).toHaveValue(768);
  });

  it("should restore previous single and responsive layouts in the current editor session", async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.change(screen.getByLabelText("Mobile columns"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText("Breakpoint px"), {
      target: { value: "1024" },
    });
    fireEvent.click(screen.getByLabelText("Single layout"));

    expect(screen.getByLabelText("Columns")).toHaveValue(6);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("single");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([{ columns: "6", minWidthPx: null }]),
      );
    });

    fireEvent.click(screen.getByLabelText("Responsive layout"));

    expect(screen.getByLabelText("Mobile columns")).toHaveValue(10);
    expect(screen.getByLabelText("Columns")).toHaveValue(16);
    expect(screen.getByLabelText("Breakpoint px")).toHaveValue(1024);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("responsive");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "10", minWidthPx: null },
          { columns: "16", minWidthPx: "1024" },
        ]),
      );
    });
  });

  it("should render and edit all responsive breakpoint layouts in ascending order", async () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "9", minWidthPx: "1024" },
            { columns: "6", minWidthPx: null },
            { columns: "4", minWidthPx: "640" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    expect(screen.getByLabelText("Mobile columns")).toHaveValue(6);
    expect(screen.getAllByLabelText("Columns")).toHaveLength(2);
    expect(screen.getAllByLabelText("Columns")[0]).toHaveValue(4);
    expect(screen.getAllByLabelText("Breakpoint px")[0]).toHaveValue(640);
    expect(screen.getAllByLabelText("Columns")[1]).toHaveValue(9);
    expect(screen.getAllByLabelText("Breakpoint px")[1]).toHaveValue(1024);

    fireEvent.change(screen.getByLabelText("Mobile columns"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[0], {
      target: { value: "8" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[0], {
      target: { value: "768" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[1], {
      target: { value: "12" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[1], {
      target: { value: "1280" },
    });

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "7", minWidthPx: null },
          { columns: "8", minWidthPx: "768" },
          { columns: "12", minWidthPx: "1280" },
        ]),
      );
    });
  });

  it("should keep breakpoint rows stable while breakpoint px is temporarily invalid", async () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "6", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
            { columns: "12", minWidthPx: "1024" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[0], {
      target: { value: "" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[0], {
      target: { value: "9" },
    });

    expect(screen.getAllByLabelText("Columns")[0]).toHaveValue(9);
    expect(screen.getAllByLabelText("Breakpoint px")[0]).toHaveValue(null);
    expect(screen.getAllByLabelText("Columns")[1]).toHaveValue(12);
    expect(screen.getAllByLabelText("Breakpoint px")[1]).toHaveValue(1024);

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "6", minWidthPx: null },
          { columns: "9", minWidthPx: "" },
          { columns: "12", minWidthPx: "1024" },
        ]),
      );
    });
  });

  it("should restore edited responsive memory with multiple breakpoints", async () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "16", minWidthPx: "768" },
            { columns: "20", minWidthPx: "1280" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mobile columns"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[0], {
      target: { value: "14" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[0], {
      target: { value: "700" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[1], {
      target: { value: "18" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[1], {
      target: { value: "1100" },
    });
    fireEvent.click(screen.getByLabelText("Single layout"));
    fireEvent.click(screen.getByLabelText("Responsive layout"));

    expect(screen.getByLabelText("Mobile columns")).toHaveValue(10);
    expect(screen.getAllByLabelText("Columns")[0]).toHaveValue(14);
    expect(screen.getAllByLabelText("Breakpoint px")[0]).toHaveValue(700);
    expect(screen.getAllByLabelText("Columns")[1]).toHaveValue(18);
    expect(screen.getAllByLabelText("Breakpoint px")[1]).toHaveValue(1100);
  });

  it("should generate responsive README HTML from edited breakpoint rows", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "16", minWidthPx: "768" },
            { columns: "20", minWidthPx: "1280" },
          ],
          icons: "react,nextjs",
          layoutMode: "responsive",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mobile columns"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[0], {
      target: { value: "9" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[0], {
      target: { value: "700" },
    });
    fireEvent.change(screen.getAllByLabelText("Columns")[1], {
      target: { value: "15" },
    });
    fireEvent.change(screen.getAllByLabelText("Breakpoint px")[1], {
      target: { value: "1100" },
    });
    generatePreview();

    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=6&gap=8&theme=light",
    );
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(min-width: 1100px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=15&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 1100px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=15&amp;gap=8&amp;theme=light" />
  <source media="(min-width: 700px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=9&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 700px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=9&amp;gap=8&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=6&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=6&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should initialize inactive responsive memory to defaults from a single layout URL", async () => {
    render(
      <StackIconsEditor
        initialState={getStackIconsEditorInitialState({
          "column-layouts": JSON.stringify([
            { columns: "6", minWidthPx: null },
          ]),
          layout: "single",
        })}
      />,
    );

    fireEvent.click(screen.getByLabelText("Responsive layout"));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS),
      );
    });
    expect(screen.getByLabelText("Mobile columns")).toHaveValue(12);
    expect(screen.getByLabelText("Columns")).toHaveValue(18);
  });

  it("should initialize inactive single memory to defaults from a responsive layout URL", async () => {
    render(
      <StackIconsEditor
        initialState={getStackIconsEditorInitialState({
          "column-layouts": JSON.stringify([
            { columns: "8", minWidthPx: null },
            { columns: "14", minWidthPx: "900" },
          ]),
          layout: "responsive",
        })}
      />,
    );

    expect(screen.getByLabelText("Mobile columns")).toHaveValue(8);
    expect(screen.getByLabelText("Columns")).toHaveValue(14);

    fireEvent.click(screen.getByLabelText("Single layout"));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("single");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts),
      );
    });
    expect(screen.getByLabelText("Columns")).toHaveValue(18);
  });

  it("should derive initial editor state when page query params are parsed", () => {
    // Given
    const searchParams = {
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      icons: "solid,typescript",
      layout: "single",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columnLayouts: [{ columns: "6", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
      includeDarkTheme: true,
      layoutMode: "single",
      previewTheme: "light",
    });
  });

  it("should derive disabled dark theme state when page query params are parsed", () => {
    // Given
    const searchParams = {
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      icons: "solid,typescript",
      "include-dark-theme": "false",
      layout: "single",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columnLayouts: [{ columns: "6", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
      includeDarkTheme: false,
      layoutMode: "single",
      previewTheme: "light",
    });
  });

  it("should use the default single column layout state", () => {
    expect(DEFAULT_STACK_ICONS_EDITOR_STATE).toMatchObject({
      columnLayouts: [{ columns: "18", minWidthPx: null }],
      layoutMode: "single",
    });
  });

  it("should fall back to default state when column layouts JSON is malformed", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": "{bad-json",
      gap: "10",
      icons: "solid,typescript",
      layout: "single",
    });

    expect(initialState).toMatchObject({
      columnLayouts: DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts,
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
    });
  });

  it("should fall back to default state when column layout columns are invalid", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "21", minWidthPx: null }]),
      gap: "10",
      icons: "solid,typescript",
      layout: "single",
    });

    expect(initialState).toMatchObject({
      columnLayouts: DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts,
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
    });
  });

  it("should fall back to default state when column layout columns are not integers", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "abc", minWidthPx: null }]),
      gap: "10",
      icons: "solid,typescript",
      layout: "single",
    });

    expect(initialState).toMatchObject({
      columnLayouts: DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts,
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
    });
  });

  it("should derive responsive initial editor state when responsive page query params are valid", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "768" },
      ]),
      gap: "10",
      icons: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "768" },
      ],
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "responsive",
    });
  });

  it("should use default responsive layouts when responsive layout params omit column layouts", () => {
    const initialState = getStackIconsEditorInitialState({
      gap: "10",
      icons: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "responsive",
    });
  });

  it("should fall back to default state when responsive layout has no breakpoint", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      icons: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: DEFAULT_STACK_ICONS_EDITOR_STATE.columnLayouts,
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
    });
  });

  it("should preserve editable responsive state when breakpoint px is out of range", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "3841" },
      ]),
      gap: "10",
      icons: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "3841" },
      ],
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "responsive",
    });
  });
});
