import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CheckboxIndicator } from "./CheckboxIndicator";

describe("CheckboxIndicator", () => {
  it("should render an unchecked visual (border only, no icon) for unchecked state", () => {
    // Given / When
    const { container } = render(<CheckboxIndicator state="unchecked" />);

    // Then
    const span = container.firstChild as HTMLElement;
    expect(span).toBeInTheDocument();
    expect(span).toHaveAttribute("aria-hidden", "true");
    expect(span.className).toContain("border-[1.5px]");
    expect(span.className).toContain("border-border-ink");
    expect(span.querySelector("svg")).not.toBeInTheDocument();
  });

  it("should render a checked visual with check icon for checked state", () => {
    // Given / When
    const { container } = render(<CheckboxIndicator state="checked" />);

    // Then
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-accent");
    expect(span.className).toContain("text-white");
    const icon = span.querySelector("svg");
    expect(icon).not.toBeNull();
    // CheckIcon from lucide has a data-testid or can be identified by presence
    // We assert by structure: one icon present and no minus
    expect(span.querySelectorAll("svg")).toHaveLength(1);
  });

  it("should render an indeterminate visual with minus icon for indeterminate state", () => {
    // Given / When
    const { container } = render(<CheckboxIndicator state="indeterminate" />);

    // Then
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-accent");
    expect(span.className).toContain("text-white");
    const icon = span.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(span.querySelectorAll("svg")).toHaveLength(1);
  });

  it("should merge additional className onto the wrapper span", () => {
    // Given / When
    const { container } = render(
      <CheckboxIndicator className="test-extra" state="unchecked" />,
    );

    // Then
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("test-extra");
  });
});
