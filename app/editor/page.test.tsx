import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Editor from "./page";

describe("Editor", () => {
  it("should show the stack icons editor when the editor page renders", async () => {
    // Given
    render(await Editor({ searchParams: Promise.resolve({}) }));

    // When — visitor lands on the editor page (render is the action)

    // Then
    expect(screen.getByLabelText("Search icons")).toBeInTheDocument();
  });
});
