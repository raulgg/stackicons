# 0002 — /icons skips unknown slugs instead of rejecting the request

Date: 2026-06-11
Status: accepted

## Context

`/icons` previously rejected any request containing an icon slug not in the registry, returning a 400 error SVG. README image code lives in third-party READMEs we cannot update. If a slug is ever removed or renamed in the registry, every README referencing it would flip from a working image to an error image overnight.

The README image editor also lets users type slugs free-form, so unknown slugs are an expected, recoverable user state — not an exceptional one.

## Decision

- `/icons` renders the known slugs and **silently skips unknown ones**, preserving the order of the remaining icons.
- If **no** known slugs remain after skipping, the endpoint still returns the 400 error SVG (there is nothing to render).
- The editor tolerates unknown slugs: they stay in the icon order, are emitted in generated image source URLs, and are flagged inline as errors for the user to correct. Copying README image code is not blocked.

## Consequences

- Published READMEs degrade gracefully (one missing icon) instead of breaking entirely when the registry changes.
- A typo'd slug is no longer caught by the endpoint; the editor's inline flagging is the only guard. Users who ignore it ship an image missing that icon.
- If a flagged slug is added to the registry later, existing README image code starts showing it without any user action (slugs are carried in the URL).
- Strict 4xx-on-unknown behavior is gone; anything that relied on it for validation must validate against the registry instead.

## Alternatives considered

- **Keep strict rejection**: catches typos hard, but couples every published README to registry immutability forever. Rejected.
- **Render a placeholder/monogram for unknown slugs**: advertises the mistake in the published image. Rejected.
