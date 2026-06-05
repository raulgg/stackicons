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

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText,
    },
  });
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
      expect(params.get("columns")).toBe("4");
      expect(params.get("mobile-columns")).toBe("10");
      expect(params.get("gap")).toBe("12");
      expect(params.get("include-dark-theme")).toBe("true");
      expect(params.get("preview-theme")).toBe("light");
      expect(params.get("responsive")).toBe("false");
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
    expect(screen.getByLabelText("Light")).toBeChecked();
    expect(screen.getByLabelText("Dark")).not.toBeChecked();
    expect(screen.getByLabelText("Include responsive sources")).not.toBeChecked();
    expect(screen.getByLabelText("Mobile columns")).toHaveValue(10);
    expect(screen.getByLabelText("Mobile columns")).toBeDisabled();
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

  it("should show the Copy HTML button only after README HTML is generated", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );

    // Then
    expect(
      screen.queryByRole("button", { name: "Copy HTML" }),
    ).not.toBeInTheDocument();

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.getByRole("button", { name: "Copy HTML" })).toBeEnabled();
  });

  it("should copy generated README HTML exactly as displayed", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
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
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

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
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="88" height="40" />
</picture>`);
  });

  it("should show copy failure feedback when clipboard writing fails", async () => {
    // Given
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    mockClipboard(writeText);
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
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
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));
    await screen.findByText("HTML copied.");

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.queryByText("HTML copied.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=16&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=16&amp;gap=8&amp;theme=light" alt="React" title="React" width="40" height="40" />
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
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    await React.act(async () => {
      resolveWriteText();
    });

    // Then
    expect(screen.queryByText("HTML copied.")).not.toBeInTheDocument();
    expect(screen.queryByText("Could not copy HTML.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react&amp;columns=16&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react&amp;columns=16&amp;gap=8&amp;theme=light" alt="React" title="React" width="40" height="40" />
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
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="88" height="40" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "<source",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "theme=dark",
    );
  });

  it("should generate README HTML with mobile sources when responsive is enabled and dark theme is disabled", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "typescript,react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByLabelText("Include dark theme source"));
    fireEvent.click(screen.getByLabelText("Include responsive sources"));

    // When
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    const readmeHtml = screen.getByLabelText("README HTML");

    expect(screen.getByLabelText("Mobile columns")).toBeEnabled();
    expect(readmeHtml).toHaveValue(`<picture>
  <source media="(max-width: 520px)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=10&amp;gap=8&amp;theme=light" />
  <img src="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=16&amp;gap=8&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" width="136" height="40" />
</picture>`);
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain(
      "baseUrl",
    );
    expect((readmeHtml as HTMLTextAreaElement).value).not.toContain("v=");
  });

  it("should generate README HTML with mobile dark sources before desktop dark sources", async () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "typescript,react,nextjs" },
    });
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText("Gap"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByLabelText("Include responsive sources"));

    // When
    fireEvent.change(screen.getByLabelText("Mobile columns"), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    // Then
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <source media="(max-width: 520px) and (prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=9&amp;gap=8&amp;theme=dark" />
  <source media="(max-width: 520px)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=9&amp;gap=8&amp;theme=light" />
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=16&amp;gap=8&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=typescript%2Creact%2Cnextjs&amp;columns=16&amp;gap=8&amp;theme=light" alt="TypeScript, React, Next.js" title="TypeScript, React, Next.js" width="136" height="40" />
</picture>`);
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
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;theme=light" alt="React, Next.js" title="React, Next.js" width="88" height="40" />
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
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=16&gap=8&theme=dark";

    expect(screen.getByLabelText("Dark")).toBeChecked();
    expect(screen.getByLabelText("Include dark theme source")).not.toBeChecked();
    expect(screen.getByLabelText("SVG URL")).toHaveValue(previewUrl);
    expect(screen.getByLabelText("README HTML")).toHaveValue(`<picture>
  <img src="http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&amp;columns=16&amp;gap=8&amp;theme=light" alt="TypeScript, Next.js, Tailwind CSS, Vercel" title="TypeScript, Next.js, Tailwind CSS, Vercel" width="184" height="40" />
</picture>`);
  });

  it("should refresh the generated preview when the preview theme changes", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));

    const lightPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=16&gap=8&theme=light";
    const darkPreviewUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=16&gap=8&theme=dark";

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
      "http://localhost:3000/icons?icons=react&columns=16&gap=8&theme=light",
    );
  });

  it("should not refresh the generated preview when edit form fields are changed", () => {
    // Given
    render(
      <StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Preview" }));
    const generatedUrl =
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwindcss%2Cvercel&columns=16&gap=8&theme=light";

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
      "mobile-columns": "8",
      responsive: "true",
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
      includeDarkTheme: true,
      mobileColumns: "8",
      previewTheme: "light",
      responsive: true,
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
      mobileColumns: "10",
      previewTheme: "light",
      responsive: false,
    });
  });
});
