"use client";

import * as React from "react";
import { useTheme } from "next-themes";

const HOME_WALL = [
  "typescript",
  "react",
  "python",
  "go",
  "rust",
  "docker",
  "postgresql",
  "nodedotjs",
  "svelte",
  "kotlin",
  "graphql",
  "redis",
  "vite",
  "javascript",
  "nextdotjs",
  "tailwindcss",
  "django",
  "kubernetes",
  "mongodb",
  "swift",
  "vuedotjs",
  "figma",
  "terraform",
  "mysql",
  "php",
  "dart",
  "ruby",
  "laravel",
  "flutter",
  "prisma",
  "supabase",
  "cloudflare",
];

function CatalogIcon({ slug, dark }: { slug: string; dark: boolean }) {
  const [err, setErr] = React.useState(false);
  React.useEffect(() => setErr(false), [slug]);
  if (err) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-[9px] border border-border bg-surface-3 font-mono text-[13px] font-semibold text-ink-2"
        style={{ width: 40, height: 40 }}
      >
        {slug.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}${dark ? "/white" : ""}`}
      width={40}
      height={40}
      alt=""
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

export function CatalogStrip() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <section
      className="border-y px-10 pt-[30px] pb-[22px] sm:px-10 sm:pt-[30px] sm:pb-[22px] max-[760px]:px-[18px] max-[760px]:pt-6 max-[760px]:pb-[18px]"
      style={{
        backgroundColor: dark ? "#16181B" : "#FCFBF8",
        borderColor: dark ? "#2A2D31" : undefined,
      }}
    >
      <div className="mx-auto flex max-w-[1080px] flex-wrap justify-center gap-[26px_36px] max-[760px]:gap-[20px_24px]">
        {HOME_WALL.map((slug) => (
          <CatalogIcon key={slug} slug={slug} dark={dark} />
        ))}
      </div>
      <p className="mt-[22px] text-center font-mono text-[11px] text-ink-3">
        50+ tools in the catalog · logos by simpleicons.org
      </p>
    </section>
  );
}
