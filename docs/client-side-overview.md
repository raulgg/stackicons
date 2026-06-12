# Client-Side Application Overview

StackIcons is a README image editor: users compose technology icon slugs into
README image code with configurable column layouts, then copy the code or
download the generated image sources. This document describes the client-side
architecture shipped by the UI overhaul.

## Page shell

- `app/layout.tsx` wraps the app in `ThemeProvider` (next-themes, class
  strategy) and mounts the sonner `Toaster`.
- `app/page.tsx` renders the app bar — `BrandMark`, the StackIcons lockup with
  the "Tech Stack Icons Composer" tagline, and `ThemeToggle` — plus a short
  hero, then the `StackIconsEditor`.
- The page is a server component: it resolves `searchParams` through
  `getStackIconsEditorInitialState` so shared URLs reopen the editor in the
  same state.
- Styling uses GitHub Primer design tokens (`app/globals.css`,
  `tailwind.config.ts`) with full light and dark variants.

## Editor structure (`app/_components/StackIconsEditor/`)

`index.tsx` lays out a 3-section accordion (`EditorSection`, keys `icons`,
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
  with an accent underline, plus a ghost download icon button. A segmented
  light/dark preview theme control floats in the top-right corner of the
  stage itself. A band picker (`getColumnLayoutPreviewBands`) offers one
  band per column layout with a usable column count, sorted by min-width;
  column layouts with unparseable columns or min-width are skipped. The
  theme toggle flips the preview between light and dark independently of
  the UI theme. Unknown slugs do not appear in the preview, matching how
  generated image sources render.
- `ReadmeImageCodePanel` shows the generated README image code with custom
  highlighting: `tokenizeReadmeImageCode` splits the HTML into
  tag/attribute/string/punctuation tokens styled by the Primer syntax
  tokens. Copying uses the clipboard API and reports the outcome via toast.
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
  previewTheme: "dark" | "light";
}
```

Every state change is mirrored into the URL with `history.replaceState`
using these search params: `icons`, `layout`, `column-layouts` (JSON),
`size`, `gap`, `preview-theme`. Unrecognized values fall back to defaults
(responsive layout with 4 base columns, 8 from 768px, 12 from 1200px).

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

- **UI theme**: the next-themes class on `<html>`, toggled by `ThemeToggle`;
  it affects only the editor chrome.
- **Preview theme** (`preview-theme` URL param): which color theme of the
  generated image source the column layout preview recreates. README image
  code always emits both light and dark sources via `<picture>` media
  queries, regardless of either theme setting.
