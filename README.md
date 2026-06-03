# readme-stack-icons

Compose an ordered stack of technology slugs into one cached SVG image for GitHub profile embeds.

## Stack

- **Runtime / package manager:** [Bun](https://bun.sh)
- **App:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Tests:** Vitest, Testing Library, jsdom

## Scripts

| Command         | Purpose             |
| --------------- | ------------------- |
| `bun run dev`   | Local dev server    |
| `bun run build` | Production build    |
| `bun run lint`  | ESLint              |
| `bun run test`  | Vitest (watch mode) |

## Layout

| Path          | Role                                     |
| ------------- | ---------------------------------------- |
| `app/`        | Routes, layouts, API route handlers      |
| `components/` | Shared UI                                |
| `lib/`        | Utilities                                |
| `docs/`       | Project conventions (one topic per file) |
| `test/`       | Vitest global setup only (`setup.ts`)    |

Unit tests are colocated with source files (e.g. `Button.tsx` → `Button.test.tsx`). See [Writing unit tests](docs/guidelines/writing-unit-tests.md).

Path alias `@/` resolves to the repo root (see `vitest.config.ts` and Next config).

## Conventions

- [Writing unit tests](docs/guidelines/writing-unit-tests.md)
