"use client";

import { BrandMark } from "@/components/BrandMark";
import { UiThemeMenu } from "@/components/UiThemeMenu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-10 py-[15px]">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="mb-2 text-[27px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
              Stack<span className="text-accent-ink">Icons</span>
            </p>
            <p className="font-mono text-[12px] uppercase leading-none text-ink-3">
              Tech Stack Icons Composer
            </p>
          </div>
        </div>
        <UiThemeMenu />
      </div>
    </header>
  );
}
