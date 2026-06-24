"use client";

import {
  ReadmeCardHeader,
  ReadmeImageCodePanel,
  ReadmePreviewStage,
  useResolvedPreviewTheme,
} from "@/app/_components/readme";

const ABBREVIATED_SNIPPET = `<picture>
  <source media="(min-width: 768px) and (prefers-color-scheme: dark)"
          srcset="https://…/icons?…&cols=8&theme=dark" />
  <source media="(min-width: 768px)"
          srcset="https://…/icons?…&cols=8" />
  <img src="https://…/icons?s=typescript,react,…&cols=4"
       alt="My tech stack" />
</picture>`;

export function DemoCard() {
  const previewTheme = useResolvedPreviewTheme();

  return (
    <section className="rounded-[6px] border bg-card text-card-foreground">
      <ReadmeCardHeader />

      <div className="mx-5 mt-[18px]">
        <ReadmePreviewStage bordered previewTheme={previewTheme}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Stack preview"
            className="block"
            src={`/icons?s=typescript,react,nextdotjs,tailwindcss,nodedotjs,postgresql,prisma,docker&cols=4&size=48&theme=${previewTheme}`}
          />
        </ReadmePreviewStage>
      </div>

      <p className="px-5 pb-[18px] pt-[10px] text-center font-mono text-[11.5px] text-ink-3">
        4 columns · 48px icons — exactly what your README shows
      </p>

      <ReadmeImageCodePanel
        readmeImageCode={ABBREVIATED_SNIPPET}
        showCopyButton={false}
      />
    </section>
  );
}
