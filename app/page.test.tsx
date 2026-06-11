import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("should show the StackIcons heading when the root page renders", async () => {
    // Given
    render(await Home({ searchParams: Promise.resolve({}) }));

    // When — visitor lands on the root page (render is the action)

    // Then
    expect(
      screen.getByRole("heading", { name: "StackIcons" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add icons" }),
    ).toBeInTheDocument();
  });
});
