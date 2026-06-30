# StackIcons

Compose an ordered stack of technology slugs into one cached SVG image for Markdown and HTML.

## Editor

The public editor builds a GitHub README-safe HTML snippet from icon slugs, column layouts (base + optional breakpoints), and gap. A base column count applies at all widths; zero or more breakpoint rows (min-width px + columns) may be added for responsive behavior.

The editor stores state in the page URL using `column-layouts` (JSON) along with the other fields.

Generated README HTML targets the short `/icons` route. Each image URL uses the current site origin with `/icons` and the public API query params `s` (comma-separated slugs, required), `cols`, `gap`, `size`, and `theme`. Responsive HTML emits multiple `<source>` URLs that differ only by `cols` and `theme`; the `/icons` API itself remains a single-layout SVG endpoint. Base URL and version/cache-busting query params are not exposed as editor form fields.

## Stack

- **Runtime / package manager:** [Bun](https://bun.sh)
- **App:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Tests:** Vitest, Testing Library, jsdom

## Scripts

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `bun run dev`          | Local dev server                 |
| `bun run build`        | Production build                 |
| `bun run lint`         | ESLint                           |
| `bun run format`       | Prettier (write)                 |
| `bun run format:check` | Prettier (check only)            |
| `bun run type-check`   | Next.js route types + TypeScript |
| `bun run test`         | Vitest (one run)                 |
| `bun run test:watch`   | Vitest (watch mode)              |

### Tests

Unit tests run on **Vitest** with Testing Library and jsdom. Use `bun run test` for a single run, or `bun run test:watch` while developing — not `bun test`, which is Bun's separate test runner and is blocked by a `bunfig.toml` preload guard.

Tests are **colocated** next to the file they cover, using the same base name with a `.test` suffix (e.g. `Button.tsx` → `Button.test.tsx`). That applies to components, hooks, utilities, API route handlers, and any other unit under test.

| Path                | Role                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `vitest.config.ts`  | jsdom environment, `@/` alias, setup file                                                         |
| `vitest.setup.ts`   | Shared matchers (`jest-dom`) and jsdom polyfills (`matchMedia`, `PointerEvent`, `ResizeObserver`) |
| `bun-test-guard.ts` | Exits with an error if `bun test` is invoked directly                                             |

Coverage spans the editor UI (`app/_components/StackIconsEditor/`), shared components, the `/icons` API route, and pure logic in `lib/icons/`. Component tests query the DOM by role, label, or accessible name; lib tests call functions directly.

Tests follow **Given – When – Then** structure with names like `should [outcome] when [action]`. See [Writing unit tests](docs/guidelines/writing-unit-tests.md) for conventions and examples.

## Layout

| Path          | Role                                 |
| ------------- | ------------------------------------ |
| `app/`        | Routes, layouts, API route handlers  |
| `components/` | Shared UI                            |
| `lib/`        | Utilities                            |
| `docs/`       | Project documentation and guidelines |

Path alias `@/` resolves to the repo root (see `vitest.config.ts` and Next config).
