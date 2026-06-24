import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
  FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
  ReadmeImageCodePanel,
  tokenizeReadmeImageCode,
} from "./ReadmeImageCodePanel";

const README_IMAGE_CODE = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=dark" />
  <img src="http://localhost:3000/icons?icons=react%2Cnextjs&amp;columns=4&amp;gap=8&amp;size=48&amp;theme=light" alt="React, Next.js" title="React, Next.js" />
</picture>`;

describe("tokenizeReadmeImageCode", () => {
  it("should reproduce the exact README image code when token texts are concatenated", () => {
    // Given / When
    const tokens = tokenizeReadmeImageCode(README_IMAGE_CODE);

    // Then
    expect(tokens.map((token) => token.text).join("")).toBe(README_IMAGE_CODE);
  });

  it("should classify tags, attributes, string values, and punctuation when tokenizing picture markup", () => {
    // Given / When
    const tokens = tokenizeReadmeImageCode(
      '<source media="(prefers-color-scheme: dark)" />',
    );

    // Then
    expect(tokens).toEqual([
      { kind: "punctuation", text: "<" },
      { kind: "tag", text: "source" },
      { kind: "text", text: " " },
      { kind: "attribute", text: "media" },
      { kind: "punctuation", text: "=" },
      { kind: "punctuation", text: '"' },
      { kind: "string", text: "(prefers-color-scheme: dark)" },
      { kind: "punctuation", text: '"' },
      { kind: "text", text: " " },
      { kind: "punctuation", text: "/>" },
    ]);
  });
});

describe("ReadmeImageCodePanel", () => {
  it("should render highlighted code matching the clipboard payload when README image code exists", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        onCopy={vi.fn()}
        readmeImageCode={README_IMAGE_CODE}
      />,
    );

    // When — panel renders open by default (render is the action)

    // Then
    expect(screen.getByLabelText("README image code")).toHaveTextContent(
      "picture",
    );
    expect(screen.getByLabelText("README image code").textContent).toBe(
      README_IMAGE_CODE,
    );
  });

  it("should omit aria-controls on the disclosure button when the code is collapsed", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        onCopy={vi.fn()}
        readmeImageCode={README_IMAGE_CODE}
      />,
    );
    const disclosureButton = screen.getByRole("button", {
      name: "README code · <picture>",
    });

    // When
    fireEvent.click(disclosureButton);

    // Then
    expect(disclosureButton).not.toHaveAttribute("aria-controls");
  });

  it("should point aria-controls at the code block id when the code is expanded", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        onCopy={vi.fn()}
        readmeImageCode={README_IMAGE_CODE}
      />,
    );
    const disclosureButton = screen.getByRole("button", {
      name: "README code · <picture>",
    });
    const codeBlock = screen.getByLabelText("README image code");

    // When — panel renders open by default (render is the action)

    // Then
    expect(disclosureButton).toHaveAttribute("aria-controls", codeBlock.id);
  });

  it("should hide the code and its copy button when the disclosure collapses", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        onCopy={vi.fn()}
        readmeImageCode={README_IMAGE_CODE}
      />,
    );

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

  it("should render code without a copy button when showCopyButton is false", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        readmeImageCode={README_IMAGE_CODE}
        showCopyButton={false}
      />,
    );

    // Then
    expect(screen.getByLabelText("README image code")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy README code" }),
    ).not.toBeInTheDocument();
  });

  describe("copied feedback", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function getCopyButton() {
      return screen.getByRole("button", { name: "Copy README code" });
    }

    it("should show Copied temporarily when copying succeeds", async () => {
      // Given
      vi.useFakeTimers();
      render(
        <ReadmeImageCodePanel
          onCopy={vi.fn().mockResolvedValue(true)}
          readmeImageCode={README_IMAGE_CODE}
        />,
      );

      // When
      await act(async () => {
        fireEvent.click(getCopyButton());
      });

      // Then — feedback shows, then reverts after the timeout
      expect(
        screen.getByRole("button", { name: "Copied" }),
      ).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(
        screen.queryByRole("button", { name: "Copied" }),
      ).not.toBeInTheDocument();
      expect(getCopyButton()).toBeInTheDocument();
    });

    it("should keep showing Copy when copying fails", async () => {
      // Given
      render(
        <ReadmeImageCodePanel
          onCopy={vi.fn().mockResolvedValue(false)}
          readmeImageCode={README_IMAGE_CODE}
        />,
      );

      // When
      await act(async () => {
        fireEvent.click(getCopyButton());
      });

      // Then
      expect(getCopyButton()).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copied" }),
      ).not.toBeInTheDocument();
    });
  });

  it("should show the empty placeholder and disable copying when README image code is empty", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        emptyPlaceholder={ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER}
        onCopy={vi.fn()}
        readmeImageCode=""
      />,
    );

    // When — panel renders without code (render is the action)

    // Then
    expect(screen.getByLabelText("README image code").textContent).toBe(
      ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
    );
    expect(
      screen.getByRole("button", { name: "Copy README code" }),
    ).toBeDisabled();
  });

  it("should render a custom empty placeholder when provided", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        emptyPlaceholder={FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER}
        onCopy={vi.fn()}
        readmeImageCode=""
      />,
    );

    // Then
    expect(screen.getByLabelText("README image code").textContent).toBe(
      FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER,
    );
  });
});
