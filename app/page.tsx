import React from "react";

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
      <section className="flex flex-1 flex-col items-center justify-center gap-10 py-10">
        <div className="w-full max-w-3xl text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-normal text-muted-foreground">
            Public editor placeholder
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-none text-foreground sm:text-6xl">
            StackIcons
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-mono text-base leading-7 text-muted-foreground">
            Compose an ordered stack of technology slugs into one cached SVG
            image for GitHub READMEs.
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <StackIconsEditor initialState={initialEditorState} />
        </div>
      </section>
    </main>
  );
}
