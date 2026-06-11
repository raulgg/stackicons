import React from "react";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";

import { StackIconsEditor } from "./_components/StackIconsEditor";
import { getStackIconsEditorInitialState } from "./_components/StackIconsEditor/state";

type SearchParams = Record<string, string | string[] | undefined>;

type HomeProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps = {}) {
  const resolvedSearchParams = await searchParams;
  const initialEditorState = getStackIconsEditorInitialState(
    resolvedSearchParams ?? {},
  );

  return (
    <main className="mx-auto w-full max-w-[960px] bg-background px-6 pb-24 pt-[26px]">
      <header className="mb-[26px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-[23px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
              Stack<span className="text-accent-ink">Icons</span>
            </p>
            <p className="mt-px font-mono text-[14px] text-ink-3">
              readme image composer
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="mb-[26px]">
        <h1 className="mb-2 text-[27px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[34px]">
          Show off your stack.
        </h1>
        <p className="max-w-[60ch] text-base leading-[1.45] text-ink-2">
          Pick the tools you actually ship with, drag them into order, and walk
          away with one tidy{" "}
          <code className="font-mono text-[0.9em]">&lt;picture&gt;</code>{" "}
          snippet that drops straight into any README — crisp in light{" "}
          <em>and</em> dark.
        </p>
      </section>

      <StackIconsEditor initialState={initialEditorState} />
    </main>
  );
}
