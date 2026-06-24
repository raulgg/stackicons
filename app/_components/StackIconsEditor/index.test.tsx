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
import { DEFAULT_SINGLE_COLUMN_LAYOUTS } from "@/lib/icons/column-layout";
import {
  ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
  FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
} from "@/app/_components/readme";
import {
  DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  getStackIconsEditorInitialState,
} from "./state";

vi.mock("@/components/ui/sonner", () => ({
  showToast: vi.fn(),
  Toaster: () => null,
}));

// The README image code panel renders highlighted spans whose combined text
// content is the exact generated README image code string (or a placeholder
// comment when there is nothing to generate).
function getReadmeImageCodeText() {
  return screen.getByLabelText("README image code").textContent;
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

const SINGLE_LAYOUT_EDITOR_STATE: StackIconsEditorState = {
  ...DEFAULT_STACK_ICONS_EDITOR_STATE,
  columnLayouts: [{ columns: "4", minWidthPx: null }],
  layoutMode: "single",
};

function renderEditor() {
  render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
}

function renderSingleLayoutEditor() {
  render(<StackIconsEditor initialState={SINGLE_LAYOUT_EDITOR_STATE} />);
}

function generatePreview() {
  // Output is generated automatically from the current valid editor state.
}

function expectGeneratedImageSourceUrl(url: string) {
  expect(getReadmeImageCodeText()).toContain(url.replaceAll("&", "&amp;"));
}

function getIconSlugsTextarea() {
  if (screen.queryByLabelText("Icon slugs") === null) {
    fireEvent.click(screen.getByRole("button", { name: "Edit slugs as text" }));
  }

  return screen.getByLabelText("Icon slugs");
}

function getLayoutModeTab(name: "Responsive" | "Single") {
  return screen.getByRole("tab", { name });
}

function selectLayoutMode(name: "Responsive" | "Single") {
  // Radix tab triggers activate on pointer-down + focus, not a bare click.
  const tab = getLayoutModeTab(name);

  fireEvent.mouseDown(tab);
  fireEvent.focus(tab);
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
    renderSingleLayoutEditor();
    expect(getReadmeImageCodeText()).toContain("<picture>");

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

      expect(params.get("icons")).toBe("react,nextjs");
      expect(params.get("layout")).toBe("single");
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
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=12&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=12&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
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
    renderSingleLayoutEditor();

    // When
    fireEvent.keyDown(getIconSizeSlider(), { key: "ArrowRight" });

    // Then
    expect(getIconSizeSlider()).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("50px")).toBeInTheDocument();
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&size=50&theme=light",
    );
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("size")).toBe("50");
    });
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
    expect(getLayoutModeTab("Single")).toHaveAttribute("aria-selected", "true");
    expect(getLayoutModeTab("Responsive")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(
      screen.queryByLabelText("Include responsive sources"),
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

      expect(params.get("icons")).toBe("");
    });
    expect(getReadmeImageCodeText()).toBe(
      ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
    );
    expect(getIconSlugsTextarea()).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("`icons` must include at least one icon slug."),
    ).toBeInTheDocument();
  });

  it("should generate README image code with dark source by default", async () => {
    // Given
    renderSingleLayoutEditor();
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
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
    expect(getReadmeImageCodeText()).not.toContain("loading=");
    expect(getReadmeImageCodeText()).not.toContain("decoding=");
  });

  it("should show the Copy README code button when current editor state is valid", () => {
    // Given
    renderEditor();

    // Then
    expect(
      screen.getByRole("button", { name: "Copy README code" }),
    ).toBeEnabled();
  });

  it("should copy generated README image code exactly as displayed", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderSingleLayoutEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "4" },
    });
    setGapSliderValue(8);
    generatePreview();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy README code" }));

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(getReadmeImageCodeText());
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
  });

  it("should show copy failure feedback when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    renderEditor();
    generatePreview();
    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy README code" }));

    // Then
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Copy failed — select and copy manually",
      );
    });
    expect(writeText).toHaveBeenCalledWith(getReadmeImageCodeText());
  });

  it("should show Copied feedback on the copy button when copying succeeds", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderSingleLayoutEditor();
    generatePreview();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Copy README code" }));

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
    renderSingleLayoutEditor();
    generatePreview();

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "README code · <picture>" }),
    );

    // Then
    expect(
      screen.queryByLabelText("README image code"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy README code" }),
    ).not.toBeInTheDocument();
  });

  it("should show the add-icons placeholder and disable copying when no icons are selected", () => {
    // Given
    renderSingleLayoutEditor();

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "" },
    });

    // Then
    expect(getReadmeImageCodeText()).toBe(
      ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
    );
    expect(
      screen.getByRole("button", { name: "Copy README code" }),
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

    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=12&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=10&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=10&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
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

    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`);
    expect(getReadmeImageCodeText()).toContain("theme=dark");
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

    const value = getReadmeImageCodeText();

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
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&size=48&theme=light",
    );
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1024px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1024px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(min-width: 640px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 640px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" />
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
        }}
      />,
    );

    generatePreview();

    const expectedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=light";

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
          layoutMode: "responsive",
        }}
      />,
    );

    generatePreview();

    expect(screen.getAllByText("duplicate min-width")).toHaveLength(2);
    expect(getMinWidthInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(getMinWidthInputs()[1]).toHaveAttribute("aria-invalid", "true");
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
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
    expect(screen.getByText("1–3840px")).toBeInTheDocument();
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
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
    expect(screen.getByText("2–20 columns")).toBeInTheDocument();
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
  });

  it("should reject missing base layout in single mode on generation", () => {
    render(
      <StackIconsEditor
        initialState={{
          ...DEFAULT_STACK_ICONS_EDITOR_STATE,
          columnLayouts: [{ columns: "4", minWidthPx: "640" }],
          layoutMode: "single",
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
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
  });

  it("should clear stale generated output when column layout generation fails", () => {
    renderSingleLayoutEditor();
    generatePreview();

    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&size=48&theme=light",
    );
    expect(getReadmeImageCodeText()).toContain("<picture>");

    selectLayoutMode("Responsive");
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "1" },
    });
    generatePreview();

    expect(getBaseColumnsInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("2–20 columns")).toBeInTheDocument();
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
  });

  it("should generate basic README image code without icons param for explicit all icons", async () => {
    // Given
    renderSingleLayoutEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "all" },
    });

    // When
    generatePreview();

    // Then
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="All stack icons" title="All stack icons" />
</picture>`);
  });

  it("should preserve README image code URL param order and escape attribute separators", async () => {
    // Given
    renderSingleLayoutEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "typescript,react,nextjs" },
    });

    // When
    generatePreview();

    // Then
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" />
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
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=12&size=48&theme=light";

    expectGeneratedImageSourceUrl(expectedUrl);
  });

  it("should flag unknown slugs inline while still generating README image code", () => {
    // Given
    renderSingleLayoutEditor();

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
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnot-real%2Creact&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnot-real%2Creact&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, React" title="TypeScript, React" />
</picture>`);
  });

  it("should copy README image code carrying unknown slugs when copy is clicked", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    renderEditor();
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "typescript,not-real,react" },
    });
    generatePreview();

    const copyButton = screen.getByRole("button", {
      name: "Copy README code",
    });

    expect(copyButton).toBeEnabled();

    // When
    fireEvent.click(copyButton);

    // Then
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(getReadmeImageCodeText());
    });
    expect(writeText.mock.calls[0]?.[0]).toContain(
      "icons=typescript%2Cnot-real%2Creact",
    );
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
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
  });

  it("should clear stale validation errors after successful preview generation", () => {
    // Given
    renderSingleLayoutEditor();
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
      "http://localhost:3000/icons?icons=react&columns=4&gap=8&size=48&theme=light",
    );
  });

  it("should refresh the generated preview when valid form fields are changed", () => {
    // Given
    renderSingleLayoutEditor();
    generatePreview();
    const generatedUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&size=48&theme=light";

    expectGeneratedImageSourceUrl(generatedUrl);

    // When
    fireEvent.change(getIconSlugsTextarea(), {
      target: { value: "react,nextjs" },
    });

    // Then
    const nextGeneratedUrl =
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=8&size=48&theme=light";

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

  it("should switch to the default responsive column layouts", async () => {
    renderSingleLayoutEditor();

    selectLayoutMode("Responsive");

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("responsive");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS),
      );
    });
    expect(getLayoutModeTab("Responsive")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(getBaseColumnsInput()).toHaveValue(4);
    expect(getBreakpointColumnsInput(0)).toHaveValue(8);
    expect(getMinWidthInputs()[0]).toHaveValue(768);
    expect(getBreakpointColumnsInput(1)).toHaveValue(12);
    expect(getMinWidthInputs()[1]).toHaveValue(1200);
  });

  it("should restore previous single and responsive layouts in the current editor session", async () => {
    renderSingleLayoutEditor();

    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "6" },
    });
    selectLayoutMode("Responsive");
    fireEvent.change(getBaseColumnsInput(), {
      target: { value: "10" },
    });
    fireEvent.change(getBreakpointColumnsInput(0), {
      target: { value: "16" },
    });
    fireEvent.change(getMinWidthInputs()[0], {
      target: { value: "1024" },
    });
    selectLayoutMode("Single");

    expect(getBaseColumnsInput()).toHaveValue(6);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("single");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify([{ columns: "6", minWidthPx: null }]),
      );
    });

    selectLayoutMode("Responsive");

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
          { columns: "12", minWidthPx: "1200" },
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

  it("should add a prefilled breakpoint row using the next free min width", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(getColumnInputs()).toHaveLength(4);
    expect(getMinWidthInputs()).toHaveLength(3);
    expect(getBreakpointColumnsInput(2)).toHaveValue(6);
    expect(getMinWidthInputs()[2]).toHaveValue(1024);

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

    expect(getBreakpointColumnsInput(3)).toHaveValue(6);
    expect(getMinWidthInputs()[3]).toHaveValue(1280);
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify([
          { columns: "4", minWidthPx: null },
          { columns: "8", minWidthPx: "768" },
          { columns: "12", minWidthPx: "1200" },
          { columns: "6", minWidthPx: "1024" },
          { columns: "6", minWidthPx: "1280" },
        ]),
      );
    });
  });

  it("should ignore a fully emptied breakpoint row when generating", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));
    fireEvent.change(getBreakpointColumnsInput(2), {
      target: { value: "" },
    });
    fireEvent.change(getMinWidthInputs()[2], {
      target: { value: "" },
    });

    generatePreview();

    expect(screen.queryByText("2–20 columns")).not.toBeInTheDocument();
    expect(screen.queryByText("1–3840px")).not.toBeInTheDocument();
    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=4&gap=8&size=48&theme=light",
    );
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1200px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1200px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=12&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(min-width: 768px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 768px)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=8&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" />
</picture>`);
  });

  it("should reject a partially emptied breakpoint row when generating", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));
    fireEvent.change(getMinWidthInputs()[2], {
      target: { value: "" },
    });

    generatePreview();

    expect(getMinWidthInputs()[2]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("1–3840px")).toBeInTheDocument();
    expect(getReadmeImageCodeText()).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
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

    expect(
      screen.queryByRole("button", { name: /Remove.*breakpoint/u }),
    ).toBeNull();
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

    expect(
      screen.getAllByRole("button", { name: /Remove.*breakpoint/u }),
    ).toHaveLength(2);
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

    expect(getLayoutModeTab("Responsive")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(20);
    expect(getMinWidthInputs()[0]).toHaveValue(1280);
    expect(
      screen.queryByRole("button", { name: /Remove.*breakpoint/u }),
    ).toBeNull();
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
    selectLayoutMode("Single");
    selectLayoutMode("Responsive");

    expect(getLayoutModeTab("Responsive")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(getBaseColumnsInput()).toHaveValue(12);
    expect(getBreakpointColumnsInput(0)).toHaveValue(20);
    expect(getMinWidthInputs()[0]).toHaveValue(1280);
    expect(
      screen.queryByRole("button", { name: /Remove.*breakpoint/u }),
    ).toBeNull();
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
    selectLayoutMode("Single");
    selectLayoutMode("Responsive");

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

    expectGeneratedImageSourceUrl(
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=6&gap=8&size=48&theme=light",
    );
    expect(getReadmeImageCodeText()).toBe(`<picture>
  <source media="(min-width: 1100px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=15&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 1100px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=15&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(min-width: 700px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=9&amp;gap=8&amp;size=48&amp;theme=dark" />
  <source media="(min-width: 700px)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=9&amp;gap=8&amp;size=48&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=6&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=6&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
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

    selectLayoutMode("Responsive");

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_RESPONSIVE_COLUMN_LAYOUTS),
      );
    });
    expect(getBaseColumnsInput()).toHaveValue(4);
    expect(getBreakpointColumnsInput(0)).toHaveValue(8);
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

    selectLayoutMode("Single");

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("layout")).toBe("single");
      expect(params.get("column-layouts")).toBe(
        JSON.stringify(DEFAULT_SINGLE_COLUMN_LAYOUTS),
      );
    });
    expect(getBaseColumnsInput()).toHaveValue(4);
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
      iconSize: "48",
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
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
      iconSize: "48",
      gap: "10",
      icons: "solid,typescript",
      layoutMode: "single",
    });
  });

  it("should use the default responsive column layout state", () => {
    expect(DEFAULT_STACK_ICONS_EDITOR_STATE).toMatchObject({
      columnLayouts: DEFAULT_RESPONSIVE_COLUMN_LAYOUTS,
      layoutMode: "responsive",
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
      columnLayouts: DEFAULT_SINGLE_COLUMN_LAYOUTS,
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
      columnLayouts: DEFAULT_SINGLE_COLUMN_LAYOUTS,
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
      columnLayouts: DEFAULT_SINGLE_COLUMN_LAYOUTS,
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

  it("should fall back to default responsive layouts when responsive layout has no breakpoint", () => {
    const initialState = getStackIconsEditorInitialState({
      "column-layouts": JSON.stringify([{ columns: "6", minWidthPx: null }]),
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

      expect(params.get("icons")).toBe(
        "typescript,nextjs,tailwindcss,vercel,react",
      );
    });
    expect(screen.getByRole("option", { name: "React react" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
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

      expect(params.get("icons")).toBe("nextjs,tailwindcss,vercel");
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

      expect(params.get("icons")).toBe("typescript,tailwindcss,vercel");
    });
    expect(
      screen.queryByRole("button", { name: "Remove Next.js" }),
    ).not.toBeInTheDocument();
  });

  it("should reorder icons in the page query and README image code when a tile is dropped on another tile", async () => {
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

      expect(params.get("icons")).toBe("nextjs,tailwindcss,vercel,typescript");
    });
    expectGeneratedImageSourceUrl(
      "icons=nextjs%2Ctailwindcss%2Cvercel%2Ctypescript",
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

      expect(params.get("icons")).toBe("typescript");
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

      expect(params.get("icons")).toBe("react,bun,vite");
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

    it("should reflect single layout columns live in the Layout summary", () => {
      renderSingleLayoutEditor();

      expect(getSectionSummary("layout")).toHaveTextContent("single · 4 cols");

      fireEvent.change(getBaseColumnsInput(), {
        target: { value: "6" },
      });

      expect(getSectionSummary("layout")).toHaveTextContent("single · 6 cols");
    });

    it("should count column layouts in the Layout summary in responsive mode", () => {
      renderEditor();

      expect(getSectionSummary("layout")).toHaveTextContent(
        "responsive · 3 layouts",
      );

      fireEvent.click(screen.getByRole("button", { name: "Add breakpoint" }));

      expect(getSectionSummary("layout")).toHaveTextContent(
        "responsive · 4 layouts",
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

    it("should keep README image code output rendered outside the accordion sections", () => {
      renderEditor();

      fireEvent.click(getSectionToggle("icons"));
      fireEvent.click(getSectionToggle("layout"));
      fireEvent.click(getSectionToggle("spacing"));

      expect(getReadmeImageCodeText()).toContain("<picture>");
      expect(
        screen.getByRole("button", { name: "Copy README code" }),
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
      renderSingleLayoutEditor();

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
