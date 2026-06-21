"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { ThemeSelect, type ThemeSelectValue } from "./ThemeSelect";

const subscribeToHydration = () => () => {};

export function UiThemeMenu() {
  const { setTheme, theme } = useTheme();

  const isHydrated = React.useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return (
    <ThemeSelect
      ariaLabel="UI theme"
      onValueChange={setTheme}
      showSystemOption
      triggerVariant="surface"
      value={(isHydrated ? (theme ?? "system") : "system") as ThemeSelectValue}
    />
  );
}
