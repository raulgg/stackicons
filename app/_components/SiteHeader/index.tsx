"use client";

import Link from "next/link";

import { StackIconsBrand } from "@/components/StackIconsBrand";
import { UiThemeMenu } from "@/components/UiThemeMenu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-10 py-[15px]">
        <Link href="/">
          <StackIconsBrand variant="full" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/editor"
            className="text-[13px] font-semibold text-ink-2 hover:text-foreground"
          >
            Editor
          </Link>
          <UiThemeMenu />
        </nav>
      </div>
    </header>
  );
}
