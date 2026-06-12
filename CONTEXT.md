# StackIcons

StackIcons (formerly Readme Stack Icons) lets users compose technology icon slugs into README image code with configurable layout.

## Language

The terms below govern code identifiers, tests, and documentation. User-facing UI copy is wordsmithed freely and may diverge from canonical terms (including avoid-listed phrasings) when it reads better.

**Breakpoint**:
A viewport width threshold that changes the generated icon layout at and above a specific pixel width. Breakpoints are represented as `min-width` thresholds with their own column count.
_Avoid_: Media query, range, tier

**Base layout**:
The fallback icon layout used when no breakpoint matches. Single layout README image code has only a base layout, while responsive layout README image code has a base layout plus one or more breakpoint-specific layouts.
_Avoid_: Default layout, mobile breakpoint

**Column layout**:
A configurable icon grid layout with a column count and an optional breakpoint. The base column layout has no breakpoint and is identified by a `null` minimum width, while breakpoint-specific column layouts have a `min-width` pixel threshold.
_Avoid_: Layout rule, column preset, responsive layout

**Column layout preview**:
A live visual recreation of one generated image source for a specific column layout and color theme, shown in the README image editor. It mirrors what the generated image source will look like but is not the source itself, and it does not simulate the full responsive README image selection behavior. Unknown slugs do not appear in it, matching how generated image sources render.
_Avoid_: Responsive preview, full preview, image preview, live preview

Generated README HTML emits breakpoint-specific sources from widest to narrowest so the browser selects the first matching source.

Column layout identity belongs to the layout values themselves, not to generated IDs. UI-only keys may be used while editing, but generated IDs are not part of the column layout language.

**Preview theme**:
The color theme (light or dark) a column layout preview displays. It lives in the shareable editor URL and is independent of the UI theme, so a user can edit in a dark interface while previewing the light rendering.
_Avoid_: Page theme, color scheme, dark mode

**Single layout**:
A README image code shape with exactly one base column layout and no breakpoints.
_Avoid_: Non-responsive layout, simple mode

**Responsive layout**:
A README image code shape with a base column layout plus one or more breakpoint-specific column layouts. The default responsive layout uses 4 base columns, 8 columns from 768px upward, and 12 columns from 1200px upward.
_Avoid_: Breakpoint mode, advanced layout

**Unknown slug**:
An icon slug that is not in the icon registry. Unknown slugs keep their place in the user's icon order and are carried in README image code, but generated image sources render without them until the registry recognizes them. The README image editor flags them for correction without blocking the user.
_Avoid_: Invalid slug, bad icon, unsupported icon

**Icon size**:
The square pixel dimension at which each stack icon renders inside a generated image source. One icon size applies to the entire README image; it is not configured per column layout. Icons display at their true pixel size in the README — the image is not stretched to the container.
_Avoid_: Scale, zoom, resolution, icon width

**README image**:
The stack icon image setup generated for a GitHub README, consisting of generated image sources and README image code.
_Avoid_: Embed, picture code, preview

**README image editor**:
The user-facing workspace for composing icon slugs, configuring column layouts, generating a README image, and copying README image code.
_Avoid_: Editor, generator, builder

**UI theme**:
The appearance preference for the README image editor interface: light, dark, or system. System follows the operating system's color scheme. The UI theme is persisted locally per user and is never part of README image code, generated image sources, or shareable URLs.
_Avoid_: App theme, site theme, chrome theme, dark mode

**README image code**:
Copy-pasteable HTML for a GitHub README that displays stack icon images, optionally with different sources for breakpoints and color schemes.
_Avoid_: Embed, snippet, README code

**Generated image source**:
A generated SVG image URL for a specific column layout and color theme used by README image code.
_Avoid_: Source URL, picture source, image variant
