export type IconAssetPath = `assets/icons/${string}.svg`;
export type IconTheme = "light" | "dark";

export type IconRegistryEntry = {
  label: string;
  light: IconAssetPath;
  dark?: IconAssetPath;
};

export const iconRegistry = {
  typescript: {
    label: "TypeScript",
    light: "assets/icons/typescript.svg",
  },
  javascript: {
    label: "JavaScript",
    light: "assets/icons/javascript.svg",
  },
  html5: {
    label: "HTML",
    light: "assets/icons/html5.svg",
  },
  css: {
    label: "CSS",
    light: "assets/icons/css.svg",
  },
  react: {
    label: "React",
    light: "assets/icons/react.svg",
    dark: "assets/icons/react-dark.svg",
  },
  solidjs: {
    label: "SolidJS",
    light: "assets/icons/solidjs.svg",
  },
  nextjs: {
    label: "Next.js",
    light: "assets/icons/nextjs.svg",
  },
  astro: {
    label: "Astro",
    light: "assets/icons/astro.svg",
    dark: "assets/icons/astro-dark.svg",
  },
  tailwindcss: {
    label: "Tailwind CSS",
    light: "assets/icons/tailwindcss.svg",
  },
  arkui: {
    label: "Ark UI",
    light: "assets/icons/arkui.svg",
  },
  materialui: {
    label: "Material UI",
    light: "assets/icons/materialui.svg",
  },
  figma: {
    label: "Figma",
    light: "assets/icons/figma.svg",
  },
  nodejs: {
    label: "Node.js",
    light: "assets/icons/nodejs.svg",
  },
  bun: {
    label: "Bun",
    light: "assets/icons/bun.svg",
  },
  vite: {
    label: "Vite",
    light: "assets/icons/vite.svg",
  },
  pnpm: {
    label: "pnpm",
    light: "assets/icons/pnpm.svg",
    dark: "assets/icons/pnpm-dark.svg",
  },
  npm: {
    label: "npm",
    light: "assets/icons/npm.svg",
  },
  graphql: {
    label: "GraphQL",
    light: "assets/icons/graphql.svg",
  },
  apollographql: {
    label: "Apollo GraphQL",
    light: "assets/icons/apollographql.svg",
    dark: "assets/icons/apollographql-dark.svg",
  },
  hasura: {
    label: "Hasura",
    light: "assets/icons/hasura.svg",
    dark: "assets/icons/hasura-dark.svg",
  },
  prisma: {
    label: "Prisma",
    light: "assets/icons/prisma.svg",
    dark: "assets/icons/prisma-dark.svg",
  },
  postgresql: {
    label: "PostgreSQL",
    light: "assets/icons/postgresql.svg",
  },
  neon: {
    label: "Neon",
    light: "assets/icons/neon.svg",
  },
  redis: {
    label: "Redis",
    light: "assets/icons/redis.svg",
  },
  mongodb: {
    label: "MongoDB",
    light: "assets/icons/mongodb.svg",
    dark: "assets/icons/mongodb-dark.svg",
  },
  mysql: {
    label: "MySQL",
    light: "assets/icons/mysql.svg",
    dark: "assets/icons/mysql-dark.svg",
  },
  vercel: {
    label: "Vercel",
    light: "assets/icons/vercel.svg",
    dark: "assets/icons/vercel-dark.svg",
  },
  cloudflare: {
    label: "Cloudflare",
    light: "assets/icons/cloudflare.svg",
  },
  amazonwebservices: {
    label: "AWS",
    light: "assets/icons/amazonwebservices.svg",
    dark: "assets/icons/amazonwebservices-dark.svg",
  },
  render: {
    label: "Render",
    light: "assets/icons/render.svg",
    dark: "assets/icons/render-dark.svg",
  },
  netlify: {
    label: "Netlify",
    light: "assets/icons/netlify.svg",
  },
  docker: {
    label: "Docker",
    light: "assets/icons/docker.svg",
  },
  resend: {
    label: "Resend",
    light: "assets/icons/resend.svg",
    dark: "assets/icons/resend-dark.svg",
  },
  inngest: {
    label: "Inngest",
    light: "assets/icons/inngest.svg",
    dark: "assets/icons/inngest-dark.svg",
  },
  n8n: {
    label: "n8n",
    light: "assets/icons/n8n.svg",
  },
  sentry: {
    label: "Sentry",
    light: "assets/icons/sentry.svg",
  },
  posthog: {
    label: "PostHog",
    light: "assets/icons/posthog.svg",
  },
  git: {
    label: "Git",
    light: "assets/icons/git.svg",
  },
  github: {
    label: "GitHub",
    light: "assets/icons/github.svg",
    dark: "assets/icons/github-dark.svg",
  },
  githubactions: {
    label: "GitHub Actions",
    light: "assets/icons/githubactions.svg",
  },
  vitest: {
    label: "Vitest",
    light: "assets/icons/vitest.svg",
  },
  playwright: {
    label: "Playwright",
    light: "assets/icons/playwright.svg",
  },
  linear: {
    label: "Linear",
    light: "assets/icons/linear.svg",
  },
  vim: {
    label: "Vim",
    light: "assets/icons/vim.svg",
  },
  cursor: {
    label: "Cursor",
    light: "assets/icons/cursor.svg",
    dark: "assets/icons/cursor-dark.svg",
  },
  opencode: {
    label: "OpenCode",
    light: "assets/icons/opencode.svg",
    dark: "assets/icons/opencode-dark.svg",
  },
  codex: {
    label: "Codex",
    light: "assets/icons/codex.svg",
    dark: "assets/icons/codex-dark.svg",
  },
  claude: {
    label: "Claude",
    light: "assets/icons/claude.svg",
  },
  openclaw: {
    label: "OpenClaw",
    light: "assets/icons/openclaw.svg",
  },
} as const satisfies Record<string, IconRegistryEntry>;

export type IconSlug = keyof typeof iconRegistry;
export type RegisteredIcon = IconRegistryEntry & { slug: IconSlug };

export function getIconBySlug(slug: string): RegisteredIcon | undefined {
  if (!isIconSlug(slug)) {
    return undefined;
  }

  return {
    slug,
    ...iconRegistry[slug],
  };
}

export function getIconLabel(slug: string): string | undefined {
  return getIconBySlug(slug)?.label;
}

export function getIconLabels(slugs: readonly string[]): string[] {
  return slugs.flatMap((slug) => {
    const label = getIconLabel(slug);
    return label ? [label] : [];
  });
}

export function getIconAssetPath({
  slug,
  theme,
}: {
  slug: IconSlug;
  theme: IconTheme;
}): IconAssetPath {
  const icon: IconRegistryEntry = iconRegistry[slug];
  return theme === "dark" ? (icon.dark ?? icon.light) : icon.light;
}

export function listRegisteredIcons(): readonly RegisteredIcon[] {
  return Object.entries(iconRegistry).map(([slug, icon]) => ({
    ...(icon as IconRegistryEntry),
    slug: slug as IconSlug,
  }));
}

export function listIconSlugs(): readonly IconSlug[] {
  return Object.keys(iconRegistry) as IconSlug[];
}

export function isIconSlug(slug: string): slug is IconSlug {
  return Object.hasOwn(iconRegistry, slug);
}
