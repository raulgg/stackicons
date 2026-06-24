import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { STAGE_COLORS } from "./preview-theme";
import { ReadmePreviewStage } from "./ReadmePreviewStage";

describe("ReadmePreviewStage", () => {
  it("should apply stage colors and preview theme data attribute", () => {
    // Given / When
    render(
      <ReadmePreviewStage previewTheme="dark">
        <span>Preview content</span>
      </ReadmePreviewStage>,
    );

    // Then
    const stage = screen.getByText("Preview content").parentElement;
    expect(stage).toHaveAttribute("data-preview-theme", "dark");
    expect(stage).toHaveStyle({
      backgroundColor: STAGE_COLORS.dark.backgroundColor,
    });
  });

  it("should add bordered stage classes when bordered is true", () => {
    // Given / When
    render(
      <ReadmePreviewStage bordered previewTheme="light">
        <span>Preview content</span>
      </ReadmePreviewStage>,
    );

    // Then
    const stage = screen.getByText("Preview content").parentElement;
    expect(stage).toHaveClass("rounded-[6px]", "border");
    expect(stage).toHaveStyle({
      backgroundColor: STAGE_COLORS.light.backgroundColor,
    });
  });

  it("should omit bordered stage classes by default", () => {
    // Given / When
    render(
      <ReadmePreviewStage previewTheme="light">
        <span>Preview content</span>
      </ReadmePreviewStage>,
    );

    // Then
    const stage = screen.getByText("Preview content").parentElement;
    expect(stage).not.toHaveClass("rounded-[6px]");
    expect(stage).not.toHaveClass("border");
  });
});
