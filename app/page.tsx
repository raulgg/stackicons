import React from "react";

import {
  getStackIconsEditorInitialState,
  StackIconsEditor,
} from "./_components/StackIconsEditor";

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10">
      <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="font-mono text-sm font-medium uppercase tracking-normal text-muted-foreground">
            Public editor placeholder
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-none text-foreground sm:text-6xl">
            README Stack Icons
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-base leading-7 text-muted-foreground">
            Compose an ordered stack of technology slugs into one cached SVG
            image for GitHub profile embeds.
          </p>
        </div>

        <StackIconsEditor initialState={initialEditorState} />
      </section>
    </main>
  );
}
