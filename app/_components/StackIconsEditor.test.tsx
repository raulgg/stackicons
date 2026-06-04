import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_STACK_ICONS_EDITOR_STATE,
  getStackIconsEditorInitialState,
  StackIconsEditor,
} from "./StackIconsEditor";

function setLocation(url: string) {
  window.history.replaceState(null, "", url);
}

describe("StackIconsEditor", () => {
  beforeEach(() => {
    setLocation("/");
  });

  it("should reflect raw form state in the page query when fields change", async () => {
    // Given
    render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
    await screen.findByDisplayValue(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwind%2Cvercel&columns=16&gap=8",
    );

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
      expect(params.get("gap")).toBe("12");
      expect(params.has("v")).toBe(false);
      expect(params.has("baseUrl")).toBe(false);
    });
    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=react%2Cnextjs&columns=4&gap=12",
    );
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
    expect(screen.getByLabelText("Icon slugs")).toHaveValue(
      "solid,typescript",
    );
    expect(screen.getByLabelText("Columns")).toHaveValue(6);
    expect(screen.getByLabelText("Gap")).toHaveValue(10);
    expect(screen.queryByLabelText("Version")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Base URL")).not.toBeInTheDocument();
    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=solid%2Ctypescript&columns=6&gap=10",
    );
  });

  it("should generate all icons when the icons field is empty", async () => {
    // Given
    render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
    await screen.findByDisplayValue(
      "http://localhost:3000/icons?icons=typescript%2Cnextjs%2Ctailwind%2Cvercel&columns=16&gap=8",
    );

    // When
    fireEvent.change(screen.getByLabelText("Icon slugs"), {
      target: { value: "" },
    });

    // Then
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);

      expect(params.get("icons")).toBe("");
    });
    expect(screen.getByLabelText("SVG URL")).toHaveValue(
      "http://localhost:3000/icons?icons=all&columns=16&gap=8",
    );
  });

  it("should not use localStorage when editor state changes", () => {
    // Given
    const getItem = vi.spyOn(window.localStorage.__proto__, "getItem");
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem");

    // When
    render(<StackIconsEditor initialState={DEFAULT_STACK_ICONS_EDITOR_STATE} />);
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
    };

    // When
    const initialState = getStackIconsEditorInitialState(searchParams);

    // Then
    expect(initialState).toEqual({
      columns: "6",
      gap: "10",
      icons: "solid,typescript",
    });
  });
});
