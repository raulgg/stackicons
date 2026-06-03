import React from "react";
import { ImageIcon, Rows3 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
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
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Generate preview
            </Button>
            <Button variant="outline">
              <Rows3 className="h-4 w-4" aria-hidden="true" />
              Configure icons
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <label
            className="font-mono text-sm font-medium text-card-foreground"
            htmlFor="icons"
          >
            Icon slugs
          </label>
          <textarea
            className="mt-3 min-h-40 w-full resize-none rounded-md border bg-background p-4 font-mono text-sm outline-none ring-ring transition focus:ring-2"
            defaultValue="typescript,nextjs,tailwind,vercel"
            id="icons"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs text-muted-foreground">
                Columns
              </label>
              <div className="mt-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                12
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground">
                Gap
              </label>
              <div className="mt-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                8px
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
