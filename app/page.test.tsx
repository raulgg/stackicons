import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("should render without crashing when the root page renders", () => {
    // Given / When
    const { container } = render(<Home />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});
