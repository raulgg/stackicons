# StackIcons

StackIcons lets users compose technology icon slugs into icons image code with configurable layout.

## Language

The terms below govern code identifiers, tests, and documentation. User-facing UI copy is wordsmithed freely and may diverge from canonical terms (including avoid-listed phrasings) when it reads better.

**Breakpoint**:
A viewport width threshold that changes the generated icon layout at and above a specific pixel width. Breakpoints are represented as `min-width` thresholds with their own column count.
_Avoid_: Media query, range, tier

**Base layout**:
The fallback icon layout used when no breakpoint matches. Single layout icons image code has only a base layout, while responsive layout icons image code has a base layout plus one or more breakpoint-specific layouts.
_Avoid_: Default layout, mobile breakpoint

**Column layout**:
A valid layout value: how many columns to render, and optionally the breakpoint where that column count starts. The base column layout has no breakpoint and is identified by a `null` minimum width; breakpoint-specific column layouts have a numeric `min-width` pixel threshold.
_Avoid_: Layout rule, column preset, responsive layout

**Column layout form**:
A temporary editor value for column layout inputs while the user is typing. It exists only because form fields hold strings like `"12"` or incomplete values like `""`; after validation, it becomes a Column layout.
_Avoid_: Editable column layout, form layout, draft layout, pending layout

**Column layout preview**:
A visual rendering of one column layout in the icons image editor. It shows what one generated icons image would look like for the selected preview theme; it is not form state and it is not the generated icons image code.
_Avoid_: Responsive preview, full preview, image preview, live preview

In short: Column layout is the valid data, Column layout form is the in-progress input, and Column layout preview is the visual output.

Generated icons image code emits breakpoint-specific sources from widest to narrowest so the browser selects the first matching source.

Column layout identity belongs to the layout values themselves, not to generated IDs. UI-only keys may be used while editing, but generated IDs are not part of the column layout language.

**Preview theme**:
The color theme (light or dark) a column layout preview displays. It follows the UI theme: every UI theme change re-seeds it to match, after which the user can switch it freely without affecting the UI theme. The preview theme is ephemeral — never persisted and not part of shareable URLs.
_Avoid_: Page theme, color scheme, dark mode

**Single layout**:
An icons image code shape with exactly one base column layout and no breakpoints.
_Avoid_: Non-responsive layout, simple mode

**Responsive layout**:
An icons image code shape with a base column layout plus one or more breakpoint-specific column layouts. The default responsive layout uses 4 base columns, 8 columns from 768px upward, and 12 columns from 1200px upward.
_Avoid_: Breakpoint mode, advanced layout

**Unknown slug**:
An icon slug that is not in the icon registry. Unknown slugs keep their place in the user's icon order and are carried in icons image code, but generated icons images render without them until the registry recognizes them. The icons image editor flags them for correction and blocks generation of copyable icons image code until they are resolved.
_Avoid_: Invalid slug, bad icon, unsupported icon

**Icon size**:
The square pixel dimension at which each stack icon renders inside a generated icons image. One icon size applies to the entire icons image; it is not configured per column layout. Icons display at their true pixel size in the icons image — the image is not stretched to the container.
_Avoid_: Scale, zoom, resolution, icon width

**Icons image**:
The stack icon image setup consisting of generated icons images and icons image code. It is not specific to READMEs and can be embedded in any Markdown or HTML document.
_Avoid_: Embed, picture code, preview, README image

**Icons image editor**:
The user-facing workspace for composing icon slugs, configuring column layouts, generating an icons image, and copying icons image code.
_Avoid_: Editor, generator, builder

**UI theme**:
The appearance preference for the icons image editor interface: light, dark, or system. System follows the operating system's color scheme. The UI theme is persisted locally per user and is never part of icons image code, generated icons images, or shareable URLs.
_Avoid_: App theme, site theme, chrome theme, dark mode

**Icons image code**:
Copy-pasteable HTML (`<picture>`) that displays stack icon images, optionally with different sources for breakpoints and color schemes. It is designed to be embedded in Markdown files or raw HTML documents.
_Avoid_: Embed, snippet, README code, picture code

**Generated icons image**:
A generated SVG image URL for a specific column layout and color theme used by icons image code.
_Avoid_: Source URL, picture source, image variant
