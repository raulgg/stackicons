import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("should show the README Stack Icons heading when the root page renders", () => {
    // Given
    render(<Home />);

    // When — visitor lands on the root page (render is the action)

    // Then
    expect(
      screen.getByRole("heading", { name: "README Stack Icons" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Icon slugs")).toBeInTheDocument();
  });
});
