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
  // Output is generated automatically from the current valid editor state.
}

function expectNoGeneratedPreview() {
  expect(
    screen.queryByRole("img", { name: /column layout preview/u }),
  ).not.toBeInTheDocument();
}

function expectGeneratedPreviewUrl(url: string) {
  if (screen.queryByRole("dialog") === null) {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preview base layout column layout",
      }),
    );
  }

  expect(
    screen.getByRole("img", { name: /column layout preview/u }),
  ).toHaveAttribute("src", url);
}

function getColumnInputs() {
  return screen.getAllByLabelText("Columns");
}

function getBaseColumnsInput() {
  return getColumnInputs()[0];
}

function getBreakpointColumnsInput(index: number) {
  return getColumnInputs()[index + 1];
}

function getMinWidthInputs() {
  return screen.getAllByLabelText("Min width");
}

function closePreviewDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
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
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).not.toHaveValue("");
    expect(
      screen.queryByRole("img", { name: /column layout preview/u }),
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
      expect(params.has("include-dark-theme")).toBe(false);
      expect(params.get("preview-theme")).toBe("light");
      expect(params.has("columns")).toBe(false);
      expect(params.has("responsive")).toBe(false);
      expect(params.has("mobile-columns")).toBe(false);
      expect(params.has("baseUrl")).toBe(false);
      expect(params.has("v")).toBe(false);
    });
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=12&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=12&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
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
    expect(
      screen.queryByLabelText("Include dark theme source"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Columns")).toBeEnabled();
    expect(screen.getByLabelText("Single layout")).toBeChecked();
    expect(screen.getByLabelText("Responsive layout")).not.toBeChecked();
    expect(
      screen.queryByLabelText("Include responsive sources"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Base URL")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Version")).not.toBeInTheDocument();
    expectNoGeneratedPreview();
  });

  it("should show validation errors when the icons field is empty", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    expectNoGeneratedPreview();

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "" },
    });
    generatePreview();

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("icons")).toBe("");
    });
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
    expect(screen.getByLabelText("Icon slugs")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("`icons` must include at least one icon slug."),
    ).toBeInTheDocument();
  });

  it("should generate README image code with dark source by default", async () => {
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
    generatePreview();

    // Then
    const readmeHtml = screen.getByLabelText("README image code");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain("loading=");
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "decoding=",
    );
  });

  it("should show the Copy README image code button when current editor state is valid", () => {
    // Given
    renderEditor();

    // Then
    expect(
      screen.getByRole("button", { name: "Copy README image code" }),
    ).toBeEnabled();
  });

  it("should copy generated README image code exactly as displayed", async () => {
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

    const readmeHtml = screen.getByLabelText("README image code");

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "Copy README image code" }),
    );

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        (readmeHtml as HTMLTextAreaElement).value,
      );
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText("README image code copied.")).toBeInTheDocument();
    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should copy generated image URLs for each layout source", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    expect(
      screen.getByRole("button", { name: "Copy base layout image URL" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Copy 768px image URL" }),
    ).toBeEnabled();

    // When
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Copy base layout image URL" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Copy base layout light image URL",
      }),
    );
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Copy 768px image URL" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Copy 768px dark image URL" }),
    );

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=12&gap=8&theme=light",
      );
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark",
      );
    });
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it("should copy light and dark image URLs from the row copy menu and show copied state", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();

    // When
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Copy base layout image URL" }),
    );

    // Then
    const lightItem = screen.getByRole("menuitem", {
      name: "Copy base layout light image URL",
    });
    const darkItem = screen.getByRole("menuitem", {
      name: "Copy base layout dark image URL",
    });

    expect(lightItem).toBeEnabled();
    expect(darkItem).toBeEnabled();
    expect(lightItem).toHaveTextContent("Copy light image URL");
    expect(darkItem).toHaveTextContent("Copy dark image URL");

    // When
    fireEvent.click(lightItem);

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light",
      );
    });
    await waitFor(() => {
      expect(lightItem).toHaveTextContent("Copied");
    });
    expect(darkItem).toHaveTextContent("Copy dark image URL");

    // When
    fireEvent.click(darkItem);

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark",
      );
    });
    await waitFor(() => {
      expect(darkItem).toHaveTextContent("Copied");
    });
    expect(lightItem).toHaveTextContent("Copied");
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it("should show a copy failed state in the row copy menu when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    renderEditor();

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Copy base layout image URL" }),
    );

    const lightItem = screen.getByRole("menuitem", {
      name: "Copy base layout light image URL",
    });

    // When
    fireEvent.click(lightItem);

    // Then
    await waitFor(() => {
      expect(lightItem).toHaveTextContent("Copy failed");
    });
  });

  it("should copy the current page URL when the Copy link button is clicked", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Link copied.")).toBeInTheDocument();
  });

  it("should show copy link failure feedback when the clipboard is unavailable", async () => {
    // Given clipboard is undefined from beforeEach
    renderEditor();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    // Then
    await waitFor(() => {
      expect(screen.getByText("Could not copy link.")).toBeInTheDocument();
    });
  });

  it("should show copy failure feedback when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    const readmeHtml = screen.getByLabelText("README image code");

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "Copy README image code" }),
    );

    // Then
    await waitFor(() => {
      expect(
        screen.getByText("Could not copy README image code."),
      ).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledWith(
      (readmeHtml as HTMLTextAreaElement).value,
    );
  });

  it("should reset stale copy feedback after regenerating README image code", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    fireEvent.click(
      screen.getByRole("button", { name: "Copy README image code" }),
    );
    await screen.findByText("README image code copied.");

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    generatePreview();

    // Then
    expect(
      screen.queryByText("README image code copied."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=light" alt="React" title="React" width="100%" />
</picture>`);
  });

  it("should ignore stale copy feedback when copy finishes after regenerating README image code", async () => {
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
    fireEvent.click(
      screen.getByRole("button", { name: "Copy README image code" }),
    );

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    generatePreview();
    await React.act(async () => {
      resolveWriteText();
    });

    // Then
    expect(
      screen.queryByText("README image code copied."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Could not copy README image code."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=18&amp;gap=8&amp;theme=light" alt="React" title="React" width="100%" />
</picture>`);
  });

  it("should not render a dark theme inclusion control", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // Then
    expect(
      screen.queryByLabelText("Include dark theme source"),
    ).not.toBeInTheDocument();
  });

  it("should generate responsive README image code with dark breakpoint sources before light sources", () => {
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

    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should generate responsive README image code with dark sources", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
          icons: "react,nextjs",
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    const readmeHtml = screen.getByLabelText("README image code");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).toContain("theme=dark");
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
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    const value = (
      screen.getByLabelText("README image code") as HTMLTextAreaElement
    ).value;

    expect(value.indexOf("(min-width: 1440px)")).toBeLessThan(
      value.indexOf("(min-width: 1024px)"),
    );
    expect(value.indexOf("(min-width: 1024px)")).toBeLessThan(
      value.indexOf("(min-width: 640px)"),
    );
  });

  it("should preserve user breakpoint order while sorting generated README image code", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: "1024" },
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    expect(screen.getAllByLabelText("Columns")[0]).toHaveValue(4);
    expect(screen.getAllByLabelText("Min width")[0]).toHaveValue(1024);
    expect(screen.getAllByLabelText("Columns")[1]).toHaveValue(12);
    expect(screen.getAllByLabelText("Min width")[1]).toHaveValue(640);
    expect(screen.getAllByLabelText("Columns")[2]).toHaveValue(8);

    generatePreview();

    expect(screen.getAllByLabelText("Columns")[0]).toHaveValue(4);
    expect(screen.getAllByLabelText("Min width")[0]).toHaveValue(1024);
    expect(screen.getAllByLabelText("Columns")[1]).toHaveValue(12);
    expect(screen.getAllByLabelText("Min width")[1]).toHaveValue(640);
    expect(screen.getAllByLabelText("Columns")[2]).toHaveValue(8);
    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&theme=light",
    );
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;theme=dark" />
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

    expectGeneratedPreviewUrl(expectedUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
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

    expect(
      screen.getAllByText("Min width values must be unique."),
    ).toHaveLength(2);
    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(getMinWidthInputs()[1]).toHaveAttribute("aria-invalid", "true");
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
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

    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Min width must be an integer from 1 to 3840."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
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

    expect(getBreakpointColumnsInput(0)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("Columns must be an integer from 2 to 20."),
    ).toBeInTheDocument();
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
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

    expect(
      screen.getByText(/Exactly one base column layout is required\./u),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Single layout mode must have exactly one base layout\./u,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
  });

  it("should clear stale generated output when column layout generation fails", () => {
    renderEditor();
    generatePreview();

    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light",
    );
    closePreviewDialog();
    expect(screen.getByLabelText("README image code")).not.toHaveValue("");

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "1" },
    });
    generatePreview();

    expect(getBaseColumnsInput()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Columns must be an integer from 2 to 20."),
    ).toBeInTheDocument();
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
    expect(
      screen.queryByRole("img", { name: "column layout preview" }),
    ).not.toBeInTheDocument();
  });

  it("should generate basic README image code without icons param for explicit all icons", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "all" },
    });

    // When
    generatePreview();

    // Then
    const readmeHtml = screen.getByLabelText("README image code");

    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=18&amp;gap=8&amp;theme=light" alt="All stack icons" title="All stack icons" width="100%" />
</picture>`);
  });

  it("should preserve README image code URL param order and escape attribute separators", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "typescript,react,nextjs" },
    });

    // When
    generatePreview();

    // Then
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
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
    generatePreview();

    // Then
    const expectedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=12&theme=light";

    expectGeneratedPreviewUrl(expectedUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
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

    // When
    generatePreview();

    // Then
    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=light",
    );
    fireEvent.click(screen.getByLabelText("Dark"));

    const previewUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&theme=dark";

    expectGeneratedPreviewUrl(previewUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
    ).toHaveAttribute("src", previewUrl);
    expect(
      screen.queryByLabelText("Include dark theme source"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="100%" />
</picture>`);
  });

  it("should keep using the selected dark preview when dark sources are always generated", () => {
    // Given
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          previewTheme: "dark",
        }}
      />,
    );

    // When
    generatePreview();

    // Then
    const previewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark";

    expect(
      screen.queryByLabelText("Include dark theme source"),
    ).not.toBeInTheDocument();
    expectGeneratedPreviewUrl(previewUrl);
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=18&amp;gap=8&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" width="100%" />
</picture>`);
  });

  it("should refresh the generated preview when the preview theme changes", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    generatePreview();

    const lightPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light";
    const darkPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=dark";

    expectGeneratedPreviewUrl(lightPreviewUrl);

    // When
    fireEvent.click(screen.getByLabelText("Dark"));

    // Then
    expectGeneratedPreviewUrl(darkPreviewUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
    ).toHaveAttribute("src", darkPreviewUrl);

    // When
    fireEvent.click(screen.getByLabelText("Light"));

    // Then
    expectGeneratedPreviewUrl(lightPreviewUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
    ).toHaveAttribute("src", lightPreviewUrl);
  });

  it("should use a dark preview box background when dark preview theme is selected", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    generatePreview();
    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light",
    );
    const previewBox = screen.getByTestId("column-layout-preview-box");

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
    generatePreview();

    // Then
    expect(screen.getByLabelText("Icon slugs")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();
    expectNoGeneratedPreview();
    expect(
      screen.queryByRole("img", { name: "column layout preview" }),
    ).not.toBeInTheDocument();
  });

  it("should show validation errors when edited input is invalid", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "not-real" },
    });

    // Then
    expect(screen.getByLabelText("Icon slugs")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();
    expectNoGeneratedPreview();
  });

  it("should clear stale validation errors after successful preview generation", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "not-real" },
    });
    generatePreview();
    expect(screen.getByLabelText("Icon slugs")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    generatePreview();

    // Then
    expect(
      screen.queryByText("Unknown icon slug: not-real."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Icon slugs")).not.toHaveAttribute(
      "aria-invalid",
    );
    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=react&columns=18&gap=8&theme=light",
    );
  });

  it("should refresh the generated preview when valid form fields are changed", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    generatePreview();
    const generatedUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=18&gap=8&theme=light";

    expectGeneratedPreviewUrl(generatedUrl);

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react,nextjs" },
    });

    // Then
    const nextGeneratedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=18&gap=8&theme=light";

    expectGeneratedPreviewUrl(nextGeneratedUrl);
    expect(
      screen.getByRole("img", { name: /column layout preview/u }),
    ).toHaveAttribute("src", nextGeneratedUrl);
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
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(18);
    expect(getMinWidthInputs()[0]).toHaveValue(768);
  });

  it("should restore previous single and responsive layouts in the current editor session", async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "10" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "16" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
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

    expect(getBaseColumnsInput()).toHaveValue(10);
    expect(getBreakpointColumnsInput(0)).toHaveValue(16);
    expect(getMinWidthInputs()[0]).toHaveValue(1024);
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

  it("should render and edit responsive breakpoint layouts in user order", async () => {
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

    expect(getBaseColumnsInput()).toHaveValue(6);
    expect(getColumnInputs()).toHaveLength(3);
    expect(getBreakpointColumnsInput(0)).toHaveValue(9);
    expect(getMinWidthInputs()[0]).toHaveValue(1024);
    expect(getBreakpointColumnsInput(1)).toHaveValue(4);
    expect(getMinWidthInputs()[1]).toHaveValue(640);

    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "7" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "8" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "768" },
    });
    fireEvent.change(getBreakpointColumnsInput(1), {
      target: { value: "12" },
    });
    fireEvent.change(getMinWidthInputs()[1], {
      target: { value: "1280" },
    });

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "8", minWidthPx: "768" },
          { columns: "7", minWidthPx: null },
          { columns: "12", minWidthPx: "1280" },
        ]),
      );
    });
  });

  it("should add an editable empty breakpoint row in responsive mode", async () => {
    renderEditor();

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(getColumnInputs()).toHaveLength(3);
    expect(getMinWidthInputs()).toHaveLength(2);
    expect(getBreakpointColumnsInput(1)).toHaveValue(null);
    expect(getMinWidthInputs()[1]).toHaveValue(null);

    fireEvent.change(getBreakpointColumnsInput(1), {
      target: { value: "20" },
    });
    fireEvent.change(getMinWidthInputs()[1], {
      target: { value: "1280" },
    });

    expect(getBreakpointColumnsInput(1)).toHaveValue(20);
    expect(getMinWidthInputs()[1]).toHaveValue(1280);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "12", minWidthPx: null },
          { columns: "18", minWidthPx: "768" },
          { columns: "20", minWidthPx: "1280" },
        ]),
      );
    });
  });

  it("should ignore a fully empty added breakpoint row when generating", () => {
    renderEditor();

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(
      screen.queryByText("Columns are required when min width is set."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Min width is required when columns are set."),
    ).not.toBeInTheDocument();

    generatePreview();

    expect(
      screen.queryByText("Columns must be an integer from 2 to 20."),
    ).not.toBeInTheDocument();
    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=12&gap=8&theme=light",
    );
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
  <source media="(min-width: 768px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=18&amp;gap=8&amp;theme=dark" />
  <source media="(min-width: 768px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=18&amp;gap=8&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" width="100%" />
</picture>`);
  });

  it("should reject a partially filled added breakpoint row when generating", () => {
    renderEditor();

    fireEvent.click(screen.getByLabelText("Responsive layout"));
    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));
    fireEvent.change(getBreakpointColumnsInput(1), {
      target: { value: "20" },
    });

    generatePreview();

    expect(getMinWidthInputs()[1]).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Min width is required when columns are set."),
    ).toBeInTheDocument();
    expectNoGeneratedPreview();
    expect(screen.getByLabelText("README image code")).toHaveValue("");
  });

  it("should not render remove controls for the base row or the last breakpoint row", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "18", minWidthPx: "768" },
          ],
          layoutMode: "responsive",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /Remove/u })).toBeNull();
    expect(getBaseColumnsInput()).toHaveValue(12);
  });

  it("should render remove controls only for optional breakpoint rows", () => {
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

    expect(screen.getAllByRole("button", { name: /Remove/u })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Remove.*base/u }),
    ).not.toBeInTheDocument();
  });

  it("should remove optional breakpoint rows without switching to single layout", async () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: "Remove 768px breakpoint" }),
    );

    expect(screen.getByLabelText("Responsive layout")).toBeChecked();
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(20);
    expect(getMinWidthInputs()[0]).toHaveValue(1280);
    expect(screen.queryByRole("button", { name: /Remove/u })).toBeNull();
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("responsive");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "12", minWidthPx: null },
          { columns: "20", minWidthPx: "1280" },
        ]),
      );
    });
  });

  it("should update responsive layout memory after removing a breakpoint", () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: "Remove 768px breakpoint" }),
    );
    fireEvent.click(screen.getByLabelText("Single layout"));
    fireEvent.click(screen.getByLabelText("Responsive layout"));

    expect(screen.getByLabelText("Responsive layout")).toBeChecked();
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(20);
    expect(getMinWidthInputs()[0]).toHaveValue(1280);
    expect(screen.queryByRole("button", { name: /Remove/u })).toBeNull();
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

    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "9" },
    });

    expect(getBreakpointColumnsInput(0)).toHaveValue(9);
    expect(getMinWidthInputs()[0]).toHaveValue(null);
    expect(getBreakpointColumnsInput(1)).toHaveValue(12);
    expect(getMinWidthInputs()[1]).toHaveValue(1024);

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

    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "10" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "14" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "700" },
    });
    fireEvent.change(getBreakpointColumnsInput(1), {
      target: { value: "18" },
    });
    fireEvent.change(getMinWidthInputs()[1], {
      target: { value: "1100" },
    });
    fireEvent.click(screen.getByLabelText("Single layout"));
    fireEvent.click(screen.getByLabelText("Responsive layout"));

    expect(getBaseColumnsInput()).toHaveValue(10);
    expect(getBreakpointColumnsInput(0)).toHaveValue(14);
    expect(getMinWidthInputs()[0]).toHaveValue(700);
    expect(getBreakpointColumnsInput(1)).toHaveValue(18);
    expect(getMinWidthInputs()[1]).toHaveValue(1100);
  });

  it("should generate responsive README image code from edited breakpoint rows", () => {
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

    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "6" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "9" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "700" },
    });
    fireEvent.change(getBreakpointColumnsInput(1), {
      target: { value: "15" },
    });
    fireEvent.change(getMinWidthInputs()[1], {
      target: { value: "1100" },
    });
    generatePreview();

    expectGeneratedPreviewUrl(
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=6&gap=8&theme=light",
    );
    expect(screen.getByLabelText("README image code")).toHaveValue(`<picture>
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
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(18);
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

    expect(getBaseColumnsInput()).toHaveValue(8);
    expect(getBreakpointColumnsInput(0)).toHaveValue(14);

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
      layoutMode: "single",
      previewTheme: "light",
    });
  });

  it("should ignore obsolete dark theme query params", () => {
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

  it("should preserve editable responsive state when added breakpoint inputs are empty", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
        { columns: "", minWidthPx: "" },
      ]),
      gap: "10",
      icons: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
        { columns: "", minWidthPx: "" },
      ],
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "responsive",
    });
  });
});
