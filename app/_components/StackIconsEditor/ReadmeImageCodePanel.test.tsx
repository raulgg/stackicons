import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
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
        hasSelectedIcons
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

  it("should hide the code but keep copying available when the disclosure collapses", () => {
    // Given
    const onCopy = vi.fn();

    render(
      <ReadmeImageCodePanel
        hasSelectedIcons
        onCopy={onCopy}
        readmeImageCode={README_IMAGE_CODE}
      />,
    );

    // When
    fireEvent.click(
      screen.getByRole("button", { name: "README code · <picture>" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy README code" }));

    // Then
    expect(
      screen.queryByLabelText("README image code"),
    ).not.toBeInTheDocument();
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("should show the add-icons placeholder and disable copying when no icons are selected", () => {
    // Given
    render(
      <ReadmeImageCodePanel
        hasSelectedIcons={false}
        onCopy={vi.fn()}
        readmeImageCode=""
      />,
    );

    // When — panel renders without icons (render is the action)

    // Then
    expect(screen.getByLabelText("README image code").textContent).toBe(
      ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER,
    );
    expect(
      screen.getByRole("button", { name: "Copy README code" }),
    ).toBeDisabled();
  });
});
