import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("should show the intro heading when the root page renders", async () => {
    // Given
    render(await Home({ searchParams: Promise.resolve({}) }));

    // When — visitor lands on the root page (render is the action)

    // Then
    expect(
      screen.getByRole("heading", { name: "Show off your stack." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search icons")).toBeInTheDocument();
  });

  it("should show the brand and the UI theme menu when the root page renders", async () => {
    // Given
    render(await Home({ searchParams: Promise.resolve({}) }));

    // When — visitor lands on the root page (render is the action)

    // Then
    expect(screen.getByText("Tech Stack Icons Composer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "UI theme" }),
    ).toBeInTheDocument();
  });
});
