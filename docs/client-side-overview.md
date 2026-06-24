# Client-Side Application Overview

StackIcons is a README image editor: users compose technology icon slugs into
README image code with configurable column layouts, then copy the code or
download the generated image sources. This document describes the client-side
architecture shipped by the UI overhaul.

## Page shell

- `app/layout.tsx` wraps the app in `ThemeProvider` (next-themes, class
  strategy), mounts the sticky `SiteHeader` and `SiteFooter`, and renders the
  sonner `Toaster`.
- `/` (`app/page.tsx`) is the **landing page**: hero copy, a CTA to `/editor`,
  and `DemoCard` — a read-only README card that mirrors the UI theme. Below
  the hero, `CatalogStrip` lists registered icon categories.
- `/editor` (`app/editor/page.tsx`) is the **README image editor**: a server
  component that resolves `searchParams` through
  `getStackIconsEditorInitialState` so shared URLs reopen the editor in the
  same state, then renders `StackIconsEditor`.
- **UI theme** (light / dark / system) is toggled from `UiThemeMenu` in
  `SiteHeader`; it affects only editor chrome and landing surfaces, not
  generated README image code.
- Styling uses GitHub Primer design tokens (`app/globals.css`,
  `tailwind.config.ts`) with full light and dark variants.

## Shared README module (`app/_components/readme/`)

Landing `DemoCard` and the editor's output card share one module for README
card chrome and preview behavior:

- `ReadmeCardHeader` — "README" tab strip with optional right-side actions
  (editor download trigger).
- `ReadmePreviewStage` — themed stage surface (`STAGE_COLORS` from
  `preview-theme.ts`) wrapping the preview image or icon grid.
- `ReadmeImageCodePanel` — collapsible `<picture>` code block with syntax
  highlighting (`tokenizeReadmeImageCode`) and an optional inline copy button.
- `useResolvedPreviewTheme` — maps the resolved UI theme to `"light"` or
  `"dark"` for preview rendering (used by `DemoCard` and to seed editor preview
  theme).
- `preview-theme.ts` — `StackIconsPreviewTheme` type and stage color tokens.

## Landing DemoCard (`app/_components/landing/DemoCard.tsx`)

The landing card is a static showcase, not the editor:

- Preview theme **mirrors the UI theme** via `useResolvedPreviewTheme`; there
  is no preview-theme control on the landing page.
- `ReadmeImageCodePanel` renders an abbreviated sample snippet with
  `showCopyButton={false}` (no `onCopy` prop).
- No download action; `ReadmeCardHeader` has no right-side actions.

## Editor structure (`app/_components/StackIconsEditor/`)

`index.tsx` lays out a 3-section accordion (`EditorSection`, keys `s`,
`layout`, `spacing`) above the output card. Each section has a GitHub
file-list-style header: a gray bar with a section icon and title on the left
and a summary of its current values as right-side metadata; sections toggle
independently.

### Icons

- `IconPicker` is a focus-opens picker: focusing the search input opens a
  popover listing registered icons, filterable by text and by category chips
  ("All" plus the registry's icon categories). Clicking an icon toggles it in
  the selection.
- `SelectedIconTiles` renders the chosen slugs as a tile grid mirroring the
  generated README image; tiles support drag-reorder (drops splice the
  dragged slug into place) and per-tile removal. Unknown slugs render as
  flagged tiles instead of disappearing.
- A collapsible plain-text editor exposes the raw comma-separated slug string
  for paste-in editing.

### Layout

- A segmented mode control switches between **single layout** and
  **responsive layout**. Switching modes remembers each mode's column
  layouts, so toggling back restores them.
- The base column layout (null `minWidthPx`) is always shown; in responsive
  mode each breakpoint-specific column layout gets a row with columns and
  min-width inputs plus a remove button (the last breakpoint cannot be
  removed), and an add-breakpoint button. Added breakpoints start at 768px
  and step by 256px to the next unused min-width.

### Spacing & size

- Sliders for icon size (24–64px, step 2, default 48 per ADR 0001) and gap
  (0–24px). One icon size applies to the whole README image; it is not
  configured per column layout.

### Output card

- `ColumnLayoutPreview` is the column layout preview: a client-side
  recreation of one generated image source for a specific column layout and
  color theme. The card has a GitHub README-style header — a "README" tab
  with an accent underline, plus a ghost download icon button
  (`DownloadImagesPopover`). Inside the preview box, a **header strip**
  (muted `bg-surface-2` bar) carries column-layout tabs on the left and
  `ThemeSelect` for light/dark preview theme on the right; the box body is
  `ReadmePreviewStage`. Band selection is ephemeral UI state. Unknown slugs
  do not appear in the preview, matching how generated image sources render
  (ADR 0002).
- `ReadmeImageCodePanel` (from the shared readme module) shows the generated
  README image code with custom highlighting. Copy is **inline in the panel**
  (copy button with brief "Copied" feedback); clipboard failures surface a
  toast from `copyReadmeImageCode` in `useStackIconsEditorForm`.
- `DownloadImagesPopover` opens a theme × breakpoint matrix of generated
  image sources; selected cells are fetched and zipped client-side with
  fflate (`lib/icons/generated-image-zip.ts`). Failed fetches are skipped
  while succeeded ones still zip; outcomes are reported via toast.

## State and URL

`useStackIconsEditorForm` owns the editor state and regenerates the README
image on every change via `generateReadmeImage`
(`lib/icons/readme-image.ts`).

State shape (`state.ts`):

```ts
{
  icons: string;            // comma-separated slugs
  layoutMode: "single" | "responsive";
  columnLayouts: EditableColumnLayout[]; // { columns, minWidthPx } as strings
  iconSize: string;         // default "48"
  gap: string;              // default "8"
}
```

Every state change is mirrored into the URL with `history.replaceState`
using these search params: `s`, `layout`, `column-layouts` (JSON),
`size`, `gap`. Unrecognized values fall back to defaults (responsive layout
with 4 base columns, 8 from 768px, 12 from 1200px).

**Preview theme** is **not** in this state shape or in URL params. It is
ephemeral local state in `StackIconsEditor`, re-seeded from the resolved UI
theme on every UI theme change; see ADR 0004.

## Validation and unknown slugs

- `validateColumnLayouts` (`lib/icons/column-layout.ts`) requires exactly one
  base column layout, 2–20 columns per column layout, unique breakpoint px
  values, no breakpoints in single layout mode, and at least one breakpoint
  in responsive layout mode. Errors surface inline and block output
  generation.
- Unknown slugs (ADR 0002) are recoverable, not blocking: they keep their
  place in the user's icon order, are carried in generated image source
  URLs, and are flagged in the editor, while the `/icons` endpoint and the
  column layout preview render without them.

## Two themes, deliberately separate

- **UI theme**: the next-themes class on `<html>`, toggled by `UiThemeMenu`
  in `SiteHeader`; it affects only the editor and landing chrome.
- **Preview theme**: which color theme of the generated image source the
  column layout preview (and landing `DemoCard`) recreates. It follows the
  UI theme on change, can be overridden in the editor until the next UI
  theme change, and is never persisted or shareable (ADR 0004). README image
  code always emits both light and dark sources via `<picture>` media
  queries, regardless of either theme setting.
