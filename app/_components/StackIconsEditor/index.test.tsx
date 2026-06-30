import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StackIconsEditor, type StackIconsEditorState } from ".";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UiThemeMenu } from "@/components/UiThemeMenu";
import { showToast } from "@/components/ui/sonner";
import {
  ADD_ICONS_IMAGE_CODE_PLACEHOLDER,
  FIX_ERRORS_IMAGE_CODE_PLACEHOLDER,
} from "@/app/_components/readme";
import {
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  getStackIconsEditorInitialState,
} from "./state";

vi.mock("@/components/ui/sonner", () => ({
  showToast: vi.fn(),
  Toaster: () => null,
}));

// The icons image code panel renders highlighted spans whose combined text
// content is the exact generated icons image code string (or a placeholder
// comment when there is nothing to generate).
function getIconsImageCodeText() {
  return screen.getByLabelText("Icons image code").textContent;
}

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

const BASE_ONLY_EDITOR_STATE: StackIconsEditorState = {
  ...DEFAULT_STACK_ICONS_EDITOR_STATE,
  columnLayouts: [{ columns: "4", minWidthPx: null }],
};

function renderEditor() {
  render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
}

function renderBaseOnlyEditor() {
  render(<StackIconsEditor initialState={BASE_ONLY_EDITOR_STATE} />);
}

function generatePreview() {
  // Output is generated automatically from the current valid editor state.
}

function expectGeneratedImageSourceUrl(url: string) {
  expect(getIconsImageCodeText()).toContain(url.replaceAll("&", "&amp;"));
}

function getIconSlugsTextarea() {
  if (screen.queryByLabelText("Icon slugs") === null) {
    fireEvent.click(screen.getByRole("button", { name: "Edit slugs as text" }));
  }

  return screen.getByLabelText("Icon slugs");
}

function getColumnInputs() {
  return screen.getAllByLabelText("columns");
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

function getIconSizeSlider() {
  return screen.getByRole("slider", { name: "Icon size" });
}

function getGapSlider() {
  return screen.getByRole("slider", { name: "Gap between icons" });
}

function setSliderValue(getSlider: () => HTMLElement, targetValue: number) {
  let currentValue = Number(getSlider().getAttribute("aria-valuenow"));

  while (currentValue !== targetValue) {
    fireEvent.keyDown(getSlider(), {
      key: targetValue > currentValue ? "ArrowRight" : "ArrowLeft",
    });

    const nextValue = Number(getSlider().getAttribute("aria-valuenow"));

    if (nextValue === currentValue) {
      throw new Error(`Slider stuck at ${currentValue}`);
    }

    currentValue = nextValue;
  }
}

function setIconSizeSliderValue(targetIconSize: number) {
  setSliderValue(getIconSizeSlider, targetIconSize);
}

function setGapSliderValue(targetGap: number) {
  setSliderValue(getGapSlider, targetGap);
}

describe("StackIconsEditor", () => {
  beforeEach(() => {
    vi.mocked(showToast).mockClear();
    setLocation("/");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  it("should reflect raw form state in the page query when fields change", async () => {
    // Given
    renderBaseOnlyEditor();
    expect(getIconsImageCodeText()).toContain("<picture>");

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "4" },
    });
    setGapSliderValue(12);

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("react,nextjs");
      expect(params.has("layout")).toBe(false);
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([{ columns: "4", minWidthPx: null }]),
      );
      expect(params.get("size")).toBe("48");
      expect(params.get("gap")).toBe("12");
      expect(params.has("include-dark-theme")).toBe(false);
      expect(params.has("preview-theme")).toBe(false);
      expect(params.has("columns")).toBe(false);
      expect(params.has("responsive")).toBe(false);
      expect(params.has("mobile-columns")).toBe(false);
      expect(params.has("baseUrl")).toBe(false);
      expect(params.has("v")).toBe(false);
    });
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=12&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=12&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should render icon size and gap sliders at their defaults when the editor opens", () => {
    // Given
    renderEditor();

    // When — visitor opens the editor with default state (render is the action)

    // Then
    expect(getIconSizeSlider()).toHaveAttribute("aria-valuenow", "48");
    expect(getIconSizeSlider()).toHaveAttribute("aria-valuemin", "24");
    expect(getIconSizeSlider()).toHaveAttribute("aria-valuemax", "64");
    expect(getGapSlider()).toHaveAttribute("aria-valuenow", "8");
    expect(getGapSlider()).toHaveAttribute("aria-valuemin", "0");
    expect(getGapSlider()).toHaveAttribute("aria-valuemax", "24");
    expect(screen.getByText("48px")).toBeInTheDocument();
    expect(screen.getByText("8px")).toBeInTheDocument();
  });

  it("should step icon size by 2 and update generated image sources and URL when arrow keys move the slider", async () => {
    // Given
    renderBaseOnlyEditor();

    // When
    fireEvent.keyDown(getIconSizeSlider(), { key: "ArrowRight" });

    // Then
    expect(getIconSizeSlider()).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("50px")).toBeInTheDocument();
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&cols=4&gap=8&size=50&theme=light",
    );
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("size")).toBe("50");
    });
  });

  it("should preserve raw state when rendered with page query params", async () => {
    // Given
    setLocation(
      "/?s=solid%2Ctypescript&layout=single&column-layouts=%5B%7B%22columns%22%3A%226%22%2C%22minWidthPx%22%3Anull%7D%5D&gap=10&v=rev-2&baseUrl=https%3A%2F%2Fcdn.example",
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
          s: "solid,typescript",
          layout: "single",
          v: "rev-2",
        })}
      />,
    );

    // Then
    const iconSlugsTextarea = getIconSlugsTextarea();

    expect(await screen.findByDisplayValue("solid,typescript")).toBe(
      iconSlugsTextarea,
    );
    expect(iconSlugsTextarea).toHaveValue("solid,typescript");
    expect(getBaseColumnsInput()).toHaveValue(6);
    expect(getGapSlider()).toHaveAttribute("aria-valuenow", "10");
    expect(
      screen.queryByLabelText("Include dark theme source"),
    ).not.toBeInTheDocument();
    expect(getBaseColumnsInput()).toBeEnabled();
    expect(
      screen.queryByRole("tab", { name: "Single" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Responsive" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Base URL")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Version")).not.toBeInTheDocument();
  });

  it("should show validation errors when the icons field is empty", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "" },
    });
    generatePreview();

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("");
    });
    expect(getIconsImageCodeText()).toBe(ADD_ICONS_IMAGE_CODE_PLACEHOLDER);
    expect(getIconSlugsTextarea()).toHaveAttribute("aria-invalid", "true");
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toHaveAttribute("aria-invalid", "true");
    expect(addButton).toHaveClass("border-destructive");
    expect(screen.getByText("Add at least one icon.")).toBeInTheDocument();
  });

  it("should generate icons image code with dark source by default", async () => {
    // Given
    renderBaseOnlyEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "4" },
    });
    setGapSliderValue(8);

    // When
    generatePreview();

    // Then
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
    expect(getIconsImageCodeText()).not.toContain("loading=");
    expect(getIconsImageCodeText()).not.toContain("decoding=");
  });

  it("should show the Copy image code button when current editor state is valid", () => {
    // Given
    renderEditor();

    // Then
    expect(
      screen.getByRole("button", { name: "Copy image code" }),
    ).toBeEnabled();
  });

  it("should copy generated icons image code exactly as displayed", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderBaseOnlyEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "4" },
    });
    setGapSliderValue(8);
    generatePreview();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy image code" }));

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(getIconsImageCodeText());
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should show copy failure feedback when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy image code" }));

    // Then
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Copy failed — select and copy manually",
      );
    });
    expect(writeText).toHaveBeenCalledWith(getIconsImageCodeText());
  });

  it("should show Copied feedback on the copy button when copying succeeds", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderBaseOnlyEditor();
    generatePreview();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy image code" }));

    // Then
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Copied" }),
      ).toBeInTheDocument();
    });
    expect(showToast).not.toHaveBeenCalled();
  });

  it("should hide the code and its copy button when the disclosure is collapsed", () => {
    // Given
    renderBaseOnlyEditor();
    generatePreview();

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "Image code · <picture>" }),
    );

    // Then
    expect(screen.queryByLabelText("Icons image code")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy image code" }),
    ).not.toBeInTheDocument();
  });

  it("should show the add-icons placeholder and disable copying when no icons are selected", () => {
    // Given
    renderBaseOnlyEditor();

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "" },
    });

    // Then
    expect(getIconsImageCodeText()).toBe(ADD_ICONS_IMAGE_CODE_PLACEHOLDER);
    expect(
      screen.getByRole("button", { name: "Copy image code" }),
    ).toBeDisabled();
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

  it("should generate responsive icons image code with dark breakpoint sources before light sources", () => {
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
        }}
      />,
    );

    generatePreview();

    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=12&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=12&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=10&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=10&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should generate responsive icons image code with dark sources", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
          icons: "react,nextjs",
        }}
      />,
    );

    generatePreview();

    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
    expect(getIconsImageCodeText()).toContain("theme=dark");
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
        }}
      />,
    );

    generatePreview();

    const value = getIconsImageCodeText();

    expect(value.indexOf("(min-width: 1440px)")).toBeLessThan(
      value.indexOf("(min-width: 1024px)"),
    );
    expect(value.indexOf("(min-width: 1024px)")).toBeLessThan(
      value.indexOf("(min-width: 640px)"),
    );
  });

  it("should preserve user breakpoint order while sorting generated icons image code", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: "1024" },
            { columns: "4", minWidthPx: null },
            { columns: "8", minWidthPx: "640" },
          ],
        }}
      />,
    );

    expect(getColumnInputs()[0]).toHaveValue(4);
    expect(getMinWidthInputs()[0]).toHaveValue(1024);
    expect(getColumnInputs()[1]).toHaveValue(12);
    expect(getMinWidthInputs()[1]).toHaveValue(640);
    expect(getColumnInputs()[2]).toHaveValue(8);

    generatePreview();

    expect(getColumnInputs()[0]).toHaveValue(4);
    expect(getMinWidthInputs()[0]).toHaveValue(1024);
    expect(getColumnInputs()[1]).toHaveValue(12);
    expect(getMinWidthInputs()[1]).toHaveValue(640);
    expect(getColumnInputs()[2]).toHaveValue(8);
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&cols=4&gap=8&size=48&theme=light",
    );
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=12&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=12&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=8&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" />
</picture>`);
  });

  it("should use the base column layout for the generated image URL and preview when breakpoints are present", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "4", minWidthPx: null },
            { columns: "12", minWidthPx: "1024" },
          ],
          icons: "react,nextjs",
        }}
      />,
    );

    generatePreview();

    const expectedUrl =
      "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=light";

    expectGeneratedImageSourceUrl(expectedUrl);
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
        }}
      />,
    );

    generatePreview();

    expect(screen.getAllByText("duplicate min-width")).toHaveLength(2);
    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(getMinWidthInputs()[1]).toHaveAttribute("aria-invalid", "true");
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
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
        }}
      />,
    );

    generatePreview();

    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("1–3840px")).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
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
        }}
      />,
    );

    generatePreview();

    expect(getBreakpointColumnsInput(0)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("2–20 columns")).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should reject missing base layout on generation", () => {
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
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should clear stale generated output when column layout generation fails", () => {
    renderBaseOnlyEditor();
    generatePreview();

    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&cols=4&gap=8&size=48&theme=light",
    );
    expect(getIconsImageCodeText()).toContain("<picture>");

    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "1" },
    });
    generatePreview();

    expect(getBaseColumnsInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("2–20 columns")).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should show fix-errors placeholder when a non-registered value like 'all' is provided (no magic support)", async () => {
    // Given
    renderBaseOnlyEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "all" },
    });

    // When
    generatePreview();

    // Then
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should preserve icons image code URL param order and escape attribute separators", async () => {
    // Given
    renderBaseOnlyEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "typescript,react,nextjs" },
    });

    // When
    generatePreview();

    // Then
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=typescript%2Creact%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=typescript%2Creact%2Cnextjs&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" />
</picture>`);
  });

  it("should render a preview with the generated icons URL after explicit generation", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "4" },
    });
    setGapSliderValue(12);

    // When
    generatePreview();

    // Then
    const expectedUrl =
      "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=12&size=48&theme=light";

    expectGeneratedImageSourceUrl(expectedUrl);
  });

  it("should flag unknown slugs inline and block generation of icons image code", () => {
    // Given
    renderBaseOnlyEditor();

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "typescript,not-real,react" },
    });
    generatePreview();

    // Then
    expect(getIconSlugsTextarea()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should disable copying when unknown slugs are present", async () => {
    // Given
    renderEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "typescript,not-real,react" },
    });
    generatePreview();

    const copyButton = screen.getByRole("button", {
      name: "Copy image code",
    });

    // Then
    expect(copyButton).toBeDisabled();
  });

  it("should show validation errors when every edited icon slug is unknown", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "not-real" },
    });

    // Then
    expect(getIconSlugsTextarea()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should clear stale validation errors after successful preview generation", () => {
    // Given
    renderBaseOnlyEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "not-real" },
    });
    generatePreview();
    expect(getIconSlugsTextarea()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react" },
    });
    generatePreview();

    // Then
    expect(
      screen.queryByText("Unknown icon slug: not-real."),
    ).not.toBeInTheDocument();
    expect(getIconSlugsTextarea()).not.toHaveAttribute("aria-invalid");
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=react&cols=4&gap=8&size=48&theme=light",
    );
  });

  it("should refresh the generated preview when valid form fields are changed", () => {
    // Given
    renderBaseOnlyEditor();
    generatePreview();
    const generatedUrl =
      "http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&cols=4&gap=8&size=48&theme=light";

    expectGeneratedImageSourceUrl(generatedUrl);

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });

    // Then
    const nextGeneratedUrl =
      "http://localhost:3000/icons?s=react%2Cnextjs&cols=4&gap=8&size=48&theme=light";

    expectGeneratedImageSourceUrl(nextGeneratedUrl);
  });

  it("should not use localStorage when editor state changes", () => {
    // Given
    const getItem = vi.spyOn(window.localStorage.__proto__, "getItem");
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem");

    // When
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react" },
    });

    // Then
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("should start with base-only default column layout", () => {
    renderBaseOnlyEditor();

    expect(getBaseColumnsInput()).toHaveValue(4);
    expect(screen.queryByLabelText("Min width")).not.toBeInTheDocument();
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

  it("should add a prefilled breakpoint row using the next free min width", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(getColumnInputs()).toHaveLength(2);
    expect(getMinWidthInputs()).toHaveLength(1);
    expect(getBreakpointColumnsInput(0)).toHaveValue(6);
    expect(getMinWidthInputs()[0]).toHaveValue(768);

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(getBreakpointColumnsInput(1)).toHaveValue(6);
    expect(getMinWidthInputs()[1]).toHaveValue(1024);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "4", minWidthPx: null },
          { columns: "6", minWidthPx: "768" },
          { columns: "6", minWidthPx: "1024" },
        ]),
      );
    });
  });

  it("should ignore a fully empty breakpoint row (falling back to base-only output)", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));
    // Empty the (only) breakpoint row we just added
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "" },
    });

    generatePreview();

    // No validation errors from the emptied row
    expect(screen.queryByText("2–20 columns")).not.toBeInTheDocument();
    expect(screen.queryByText("1–3840px")).not.toBeInTheDocument();

    // Only base layout is used
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&cols=4&gap=8&size=48&theme=light",
    );
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;cols=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" />
</picture>`);
  });

  it("should reject a partially filled breakpoint row", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));
    // Partially empty the breakpoint we just added (columns filled, min-width empty)
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "" },
    });

    generatePreview();

    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("1–3840px")).toBeInTheDocument();
    expect(getIconsImageCodeText()).toBe(FIX_ERRORS_IMAGE_CODE_PLACEHOLDER);
  });

  it("should not render remove control for the base row (but does for last breakpoint)", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "18", minWidthPx: "768" },
          ],
        }}
      />,
    );

    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(
      screen.getByRole("button", { name: /Remove 768px breakpoint/u }),
    ).toBeInTheDocument();
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
        }}
      />,
    );

    expect(
      screen.getAllByRole("button", { name: /Remove.*breakpoint/u }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Remove.*base/u }),
    ).not.toBeInTheDocument();
  });

  it("should remove a breakpoint row (even the last one)", async () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "16", minWidthPx: "768" },
            { columns: "20", minWidthPx: "1280" },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remove 768px breakpoint" }),
    );

    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(20);
    expect(getMinWidthInputs()[0]).toHaveValue(1280);

    fireEvent.click(
      screen.getByRole("button", { name: /Remove 1280px breakpoint/u }),
    );

    expect(
      screen.queryByRole("button", { name: /Remove.*breakpoint/u }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.has("layout")).toBe(false);
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([{ columns: "12", minWidthPx: null }]),
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

  it("should edit base layout and multiple breakpoints", async () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [
            { columns: "12", minWidthPx: null },
            { columns: "16", minWidthPx: "768" },
            { columns: "20", minWidthPx: "1280" },
          ],
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

    expect(getBaseColumnsInput()).toHaveValue(10);
    expect(getBreakpointColumnsInput(0)).toHaveValue(14);
    expect(getMinWidthInputs()[0]).toHaveValue(700);
    expect(getBreakpointColumnsInput(1)).toHaveValue(18);
    expect(getMinWidthInputs()[1]).toHaveValue(1100);
  });

  it("should generate responsive icons image code from edited breakpoint rows", () => {
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

    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?s=react%2Cnextjs&cols=6&gap=8&size=48&theme=light",
    );
    expect(getIconsImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1100px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=15&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1100px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=15&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(min-width: 700px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=9&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 700px)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=9&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=6&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?s=react%2Cnextjs&amp;cols=6&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should derive initial editor state when page query params are parsed", () => {
    // Given
    const searchParams = {
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      s: "solid,typescript",
      layout: "single",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columnLayouts: [{ columns: "6", minWidthPx: null }],
      iconSize: "48",
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should ignore obsolete dark theme query params", () => {
    // Given
    const searchParams = {
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      s: "solid,typescript",
      "include-dark-theme": "false",
      layout: "single",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columnLayouts: [{ columns: "6", minWidthPx: null }],
      iconSize: "48",
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should use the default base-only column layout state", () => {
    expect(DEFAULT_STACK_ICONS_EDITOR_STATE).toMatchObject({
      columnLayouts: [{ columns: "4", minWidthPx: null }],
    });
  });

  it("should fall back to default state when column layouts JSON is malformed", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": "{bad-json",
      gap: "10",
      s: "solid,typescript",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should fall back to default state when column layout columns are invalid", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "21", minWidthPx: null }]),
      gap: "10",
      s: "solid,typescript",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should fall back to default state when column layout columns are not integers", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "abc", minWidthPx: null }]),
      gap: "10",
      s: "solid,typescript",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should derive initial editor state from a column-layouts query param that includes breakpoints", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "768" },
      ]),
      gap: "10",
      s: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "768" },
      ],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should use default base-only when no column-layouts provided", () => {
    const initialState = getStackIconsEditorInitialState({
      gap: "10",
      s: "solid,typescript",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [{ columns: "4", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should use provided base-only column-layouts", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
      gap: "10",
      s: "solid,typescript",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [{ columns: "6", minWidthPx: null }],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should preserve editable state with breakpoints when breakpoint px is out of range", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "3841" },
      ]),
      gap: "10",
      s: "solid,typescript",
      layout: "responsive",
    });

    expect(initialState).toMatchObject({
      columnLayouts: [
        { columns: "6", minWidthPx: null },
        { columns: "4", minWidthPx: "3841" },
      ],
      gap: "10",
      icons: "solid,typescript",
    });
  });

  it("should preserve editable state with breakpoints when added breakpoint inputs are empty", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([
        { columns: "6", minWidthPx: null },
        { columns: "12", minWidthPx: "768" },
        { columns: "", minWidthPx: "" },
      ]),
      gap: "10",
      s: "solid,typescript",
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
    });
  });

  it("should append a picker-selected icon slug to state and the page query", async () => {
    // Given
    renderEditor();

    // When
    fireEvent.focus(screen.getByLabelText("Search icons"));
    fireEvent.change(screen.getByLabelText("Search icons"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("option", { name: "React react" }));

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe(
        "typescript,nextjs,tailwindcss,vercel,react",
      );
    });
    expect(
      screen.getByRole("button", { name: "Remove React" }),
    ).toBeInTheDocument();
  });

  it("should toggle off an already-selected icon from the picker", async () => {
    // Given
    renderEditor();
    fireEvent.focus(screen.getByLabelText("Search icons"));
    fireEvent.change(screen.getByLabelText("Search icons"), {
      target: { value: "typescript" },
    });

    const option = screen.getByRole("option", {
      name: "TypeScript typescript",
    });

    expect(option).toHaveAttribute("aria-selected", "true");

    // When
    fireEvent.click(option);

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("nextjs,tailwindcss,vercel");
    });
    expect(
      screen.getByRole("option", { name: "TypeScript typescript" }),
    ).toHaveAttribute("aria-selected", "false");
    expect(
      screen.queryByRole("button", { name: "Remove TypeScript" }),
    ).not.toBeInTheDocument();
  });

  it("should filter picker options by label and slug", () => {
    // Given
    renderEditor();

    // When
    fireEvent.focus(screen.getByLabelText("Search icons"));
    fireEvent.change(screen.getByLabelText("Search icons"), {
      target: { value: "tailwind" },
    });

    // Then
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByRole("option", { name: "Tailwind CSS tailwindcss" }),
    ).toBeInTheDocument();
  });

  it("should render the icon search above the selected icon tiles", () => {
    // Given
    renderEditor();

    const searchInput = screen.getByLabelText("Search icons");
    const tileGrid = screen.getByLabelText("Selected icons");

    // Then — the search input precedes the tile grid in the DOM
    expect(
      searchInput.compareDocumentPosition(tileGrid) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("should remove a tile and preserve the remaining slug order", async () => {
    // Given
    renderEditor();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Remove Next.js" }));

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("typescript,tailwindcss,vercel");
    });
    expect(
      screen.queryByRole("button", { name: "Remove Next.js" }),
    ).not.toBeInTheDocument();
  });

  it("should reorder icons in the page query and icons image code when a tile is dropped on another tile", async () => {
    // Given — typescript,nextjs,tailwindcss,vercel
    renderEditor();

    const [typescriptTile, , , vercelTile] = within(
      screen.getByLabelText("Selected icons"),
    )
      .getAllByRole("listitem")
      .slice(0, -1);

    // When — drag the first tile onto the last tile
    fireEvent.dragStart(typescriptTile);
    fireEvent.dragOver(vercelTile);
    fireEvent.drop(vercelTile);

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("nextjs,tailwindcss,vercel,typescript");
    });
    expectGeneratedImageSourceUrl(
      "s=nextjs%2Ctailwindcss%2Cvercel%2Ctypescript",
    );
  });

  it("should focus the picker search input when the Add tile is clicked", () => {
    // Given
    renderEditor();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    // Then
    expect(screen.getByLabelText("Search icons")).toHaveFocus();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should render unknown slugs as removable danger tiles", async () => {
    // Given
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          icons: "typescript,not-real",
        }}
      />,
    );

    const unknownTile = screen.getByText("not-real").closest("li");

    expect(unknownTile).toHaveClass("border-destructive");
    expect(unknownTile).toHaveTextContent("unknown");
    expect(
      screen.getByText("Unknown icon slug: not-real."),
    ).toBeInTheDocument();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Remove not-real" }));

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("typescript");
    });
    expect(screen.queryByText("not-real")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unknown icon slug: not-real."),
    ).not.toBeInTheDocument();
  });

  it("should keep tiles, the picker, and the plain-text editor in sync", async () => {
    // Given
    renderEditor();

    const iconSlugsTextarea = getIconSlugsTextarea();

    // When
    fireEvent.change(iconSlugsTextarea, {
      target: { value: "react,bun" },
    });

    // Then
    expect(
      screen.getByRole("button", { name: "Remove React" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Bun" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove TypeScript" }),
    ).not.toBeInTheDocument();

    // When
    fireEvent.focus(screen.getByLabelText("Search icons"));
    fireEvent.change(screen.getByLabelText("Search icons"), {
      target: { value: "vite" },
    });
    fireEvent.click(screen.getByRole("option", { name: "Vite vite" }));

    // Then
    expect(iconSlugsTextarea).toHaveValue("react,bun,vite");
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("s")).toBe("react,bun,vite");
    });
  });

  describe("accordion shell", () => {
    function getSectionToggle(sectionKey: "icons" | "layout" | "spacing") {
      return screen.getByTestId(`editor-section-toggle-${sectionKey}`);
    }

    function getSectionSummary(sectionKey: "icons" | "layout" | "spacing") {
      return screen.getByTestId(`editor-section-summary-${sectionKey}`);
    }

    it("should render the three sections expanded on load", () => {
      renderEditor();

      const sectionKeys = ["icons", "layout", "spacing"] as const;

      sectionKeys.forEach((sectionKey) => {
        expect(getSectionToggle(sectionKey)).toHaveAttribute(
          "aria-expanded",
          "true",
        );
      });
      expect(getSectionToggle("icons")).toHaveTextContent("Icons");
      expect(getSectionToggle("layout")).toHaveTextContent("Layout");
      expect(getSectionToggle("spacing")).toHaveTextContent("Spacing & size");
    });

    it("should collapse and expand sections independently", () => {
      renderEditor();

      // When — collapse the Icons section only
      fireEvent.click(getSectionToggle("icons"));

      // Then
      expect(getSectionToggle("icons")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(getSectionToggle("layout")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(getSectionToggle("spacing")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.queryByLabelText("Search icons")).not.toBeInTheDocument();
      expect(getBaseColumnsInput()).toBeInTheDocument();
      expect(getGapSlider()).toBeInTheDocument();

      // When — expand the Icons section again
      fireEvent.click(getSectionToggle("icons"));

      // Then
      expect(getSectionToggle("icons")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByLabelText("Search icons")).toBeInTheDocument();
    });

    it("should show live icon labels with overflow count in the Icons summary", () => {
      renderEditor();

      expect(getSectionSummary("icons")).toHaveTextContent(
        "TypeScript, Next.js, Tailwind CSS, Vercel",
      );

      fireEvent.change(getIconSlugsTextarea(), {
        target: { value: "typescript,nextjs,tailwindcss,vercel,react" },
      });

      expect(getSectionSummary("icons")).toHaveTextContent(
        "TypeScript, Next.js, Tailwind CSS, Vercel +1",
      );
    });

    it("should show the raw slug in the Icons summary for unknown slugs", () => {
      renderEditor();

      fireEvent.change(getIconSlugsTextarea(), {
        target: { value: "typescript,not-real" },
      });

      expect(getSectionSummary("icons")).toHaveTextContent(
        "TypeScript, not-real",
      );
    });

    it("should show the none-yet Icons summary when all icon slugs are removed", () => {
      renderEditor();

      fireEvent.change(getIconSlugsTextarea(), {
        target: { value: "" },
      });

      expect(getSectionSummary("icons")).toHaveTextContent("none yet");
    });

    it("should reflect base columns live in the Layout summary", () => {
      renderBaseOnlyEditor();

      expect(getSectionSummary("layout")).toHaveTextContent("4 cols");

      fireEvent.change(getBaseColumnsInput(), {
        target: { value: "6" },
      });

      expect(getSectionSummary("layout")).toHaveTextContent("6 cols");
    });

    it("should count breakpoints in the Layout summary when present", () => {
      renderEditor();

      expect(getSectionSummary("layout")).toHaveTextContent("4 cols");

      fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

      expect(getSectionSummary("layout")).toHaveTextContent(
        "4 cols · 1 breakpoint",
      );
    });

    it("should show the icon size and live gap in the Spacing & size summary", () => {
      renderEditor();

      expect(getSectionSummary("spacing")).toHaveTextContent("48px · gap 8px");

      setGapSliderValue(12);

      expect(getSectionSummary("spacing")).toHaveTextContent("48px · gap 12px");

      setIconSizeSliderValue(56);

      expect(getSectionSummary("spacing")).toHaveTextContent("56px · gap 12px");
    });

    it("should keep icons image code output rendered outside the accordion sections", () => {
      renderEditor();

      fireEvent.click(getSectionToggle("icons"));
      fireEvent.click(getSectionToggle("layout"));
      fireEvent.click(getSectionToggle("spacing"));

      expect(getIconsImageCodeText()).toContain("<picture>");
      expect(
        screen.getByRole("button", { name: "Copy image code" }),
      ).toBeInTheDocument();
    });
  });

  describe("column layout preview", () => {
    function getPreviewThemeSelect() {
      return screen.getByRole("combobox", { name: "Preview theme" });
    }

    function selectPreviewTheme(name: "Light" | "Dark") {
      fireEvent.click(getPreviewThemeSelect());
      fireEvent.click(screen.getByRole("option", { name }));
    }

    function expectPreviewTheme(name: "Light" | "Dark") {
      expect(getPreviewThemeSelect()).toHaveTextContent(name);
    }

    function getSectionToggle(sectionKey: "icons" | "layout" | "spacing") {
      return screen.getByTestId(`editor-section-toggle-${sectionKey}`);
    }

    it("should keep the column layout preview visible when all sections are collapsed", () => {
      // Given
      renderEditor();

      // When
      fireEvent.click(getSectionToggle("icons"));
      fireEvent.click(getSectionToggle("layout"));
      fireEvent.click(getSectionToggle("spacing"));

      // Then
      expect(
        screen.getByRole("region", { name: "Column layout preview" }),
      ).toBeInTheDocument();
    });

    it("should not write the preview theme to the URL when toggled", () => {
      // Given
      renderEditor();

      // When
      selectPreviewTheme("Dark");

      // Then — the preview theme is ephemeral state (ADR 0004)
      expectPreviewTheme("Dark");
      const params = new URLSearchParams(window.location.search);

      expect(params.has("preview-theme")).toBe(false);
    });

    describe("UI theme sync", () => {
      afterEach(() => {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.removeAttribute("style");
        window.localStorage.clear();
      });

      function renderEditorWithUiThemeMenu() {
        render(
          <ThemeProvider>
            <UiThemeMenu />
            <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />
          </ThemeProvider>,
        );
      }

      function selectUiTheme(name: "Light" | "Dark" | "System") {
        fireEvent.click(screen.getByRole("combobox", { name: "UI theme" }));
        fireEvent.click(screen.getByRole("option", { name }));
      }

      it("should match the preview theme to the UI theme when the UI theme changes", async () => {
        // Given
        renderEditorWithUiThemeMenu();

        // When
        selectUiTheme("Dark");

        // Then
        await waitFor(() => {
          expectPreviewTheme("Dark");
        });
      });

      it("should keep the UI theme when the preview theme is switched after a UI theme change", async () => {
        // Given — the UI theme change re-seeded the preview theme to dark
        renderEditorWithUiThemeMenu();
        selectUiTheme("Dark");
        await waitFor(() => {
          expectPreviewTheme("Dark");
        });

        // When — the user switches the preview theme back on its own
        selectPreviewTheme("Light");

        // Then — the preview is light again while the UI stays dark
        expectPreviewTheme("Light");
        expect(document.documentElement).toHaveClass("dark");
      });
    });

    it("should keep the preview theme independent of the UI chrome theme when toggled", () => {
      // Given — the UI chrome theme is whatever the document carries
      renderEditor();

      const documentClassName = document.documentElement.className;

      // When — the IMAGE preview theme switches to dark
      selectPreviewTheme("Dark");

      // Then — stage icons use the dark image theme, UI chrome is untouched
      const stageIcon = screen.getByRole("img", {
        name: "typescript",
      }) as HTMLImageElement;

      expect(stageIcon.src).toContain("theme=dark");
      expect(document.documentElement.className).toBe(documentClassName);
    });

    it("should re-render the stage and caption when layout settings change", () => {
      // Given
      renderBaseOnlyEditor();

      // When
      fireEvent.change(getBaseColumnsInput(), { target: { value: "2" } });
      setIconSizeSliderValue(56);
      setGapSliderValue(12);

      // Then
      expect(
        screen.getByRole("list", { name: "Column layout preview icons" }).style
          .gridTemplateColumns,
      ).toBe("repeat(2, 56px)");
      expect(
        screen.getByText("any width · 56px icons · gap 12px"),
      ).toBeInTheDocument();
    });
  });
});
