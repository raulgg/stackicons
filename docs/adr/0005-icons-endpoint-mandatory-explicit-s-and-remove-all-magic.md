# 0005 — /icons requires explicit `s` parameter; remove `all` magic and full-catalog support

Date: 2026-06-26
Status: accepted

## Context

The `/icons` endpoint previously defaulted to all icons when the `s` parameter was absent (via `?icons=...` or no param at all). This led to surprising behavior when users (or copied code) used the wrong parameter name. Additionally, a magic `s=all` (or omitted `s`) value expanded to the full registry, and "all" was treated specially in URL generation and labeling.

The desire is for slugs to be explicit: `s` must be provided and contain only valid registered slugs. The `all` sentinel and implicit default are to be removed entirely. For unknown/misspelled slugs the route should remain lenient (skip for published resilience per ADR 0002), while the editor must error and block clean output.

## Decision

- The `s` query parameter is now mandatory on `/icons`.
  - Absent `s` key → 400 error SVG with "`s` is required."
  - `s` present but empty after parsing → "`s` must include at least one icon slug."
- Remove all special handling for the `all` value:
  - No preprocess default in the schema.
  - No expansion of `s=all` (or omitted `s`) to the full list.
  - No special omission of `s` in generated URLs.
  - No special "All stack icons" label.
- Unknown slugs:
  - `/icons` route: continues to skip unknowns (render known slugs only; 400 only if zero good slugs remain). Preserves ADR 0002 behavior for published images.
  - Editor: flags unknowns (as before) **and blocks** production of usable icons image code (shows fix-errors placeholder; disables copy/download) until all slugs are valid.
- The ability to easily generate a "full catalog" image via magic is dropped. Slugs must be explicitly selected.

## Consequences

- Old copied image code that relied on omitted `s` or `s=all` will now receive error SVGs (no fallbacks, per stealth-mode decision).
- The editor now prevents users from copying code that contains typos or non-registered slugs.
- Generated URLs from the editor (when valid) always include an explicit `s=...` list.
- Simpler, more predictable contract: `s` is always a literal comma-separated list of explicit slugs.
- Test and code cleanup around the removed magic.
- "Unknown slug" glossary updated to reflect that the editor now blocks output.

## Alternatives considered

- Keep `all` magic or add explicit "select all" button: rejected in favor of strict explicitness.
- Make the route also strict on any unknown (error instead of skip): rejected to preserve resilience for already-published Markdown files.
- Auto-strip unknowns in editor output: rejected; we want to force the user to see/fix the error rather than silently drop their input.
