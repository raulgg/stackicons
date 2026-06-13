import { isIconSlug } from "@/lib/icons/registry";

import { IconThumbnail } from "../StackIconsEditor/IconThumbnail";

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
].filter(isIconSlug);

export function CatalogStrip() {
  return (
    <section className="border-y border-border bg-[#FCFBF8] px-10 pt-[30px] pb-[22px] dark:border-[#2A2D31] dark:bg-[#16181B] max-[760px]:px-[18px] max-[760px]:pt-6 max-[760px]:pb-[18px]">
      <div className="mx-auto flex max-w-[1080px] flex-wrap justify-center gap-[26px_36px] max-[760px]:gap-[20px_24px]">
        {HOME_WALL.map((slug) => (
          <IconThumbnail key={slug} slug={slug} className="h-10 w-10" />
        ))}
      </div>
      <p className="mt-[22px] text-center font-mono text-[11px] text-ink-3">
        50+ tools in the catalog · logos by simpleicons.org
      </p>
    </section>
  );
}
