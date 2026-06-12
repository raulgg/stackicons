import { afterEach, describe, expect, it } from "vitest";

import { UI_THEME_RESET_FLAG, uiThemeResetScript } from "./ui-theme-reset";

function runResetScript() {
  new Function(uiThemeResetScript)();
}

describe("uiThemeResetScript", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("should clear the stored theme and set the flag when the reset has not run yet", () => {
    // Given — a user pinned by the old Light/Dark-only toggle
    window.localStorage.setItem("theme", "dark");

    // When
    runResetScript();

    // Then
    expect(window.localStorage.getItem("theme")).toBeNull();
    expect(window.localStorage.getItem(UI_THEME_RESET_FLAG)).toBe("1");
  });

  it("should keep the stored theme when the reset has already run", () => {
    // Given — the reset ran before, then the user re-picked a static theme
    window.localStorage.setItem(UI_THEME_RESET_FLAG, "1");
    window.localStorage.setItem("theme", "light");

    // When
    runResetScript();

    // Then
    expect(window.localStorage.getItem("theme")).toBe("light");
  });
});
