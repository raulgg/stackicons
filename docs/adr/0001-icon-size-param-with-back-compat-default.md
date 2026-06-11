# 0001 — Icon size endpoint param defaults to 40, editor emits 48

Date: 2026-06-11
Status: accepted

## Context

The UI overhaul introduces a user-configurable icon size (24–64px slider, design default 48). Until now the `/icons` endpoint rendered icons at a hardcoded 40px and generated README image code stretched the image with `<img width="100%">`.

README image code copied before this change lives in third-party READMEs we cannot update. Those URLs carry no `size` param.

## Decision

- `/icons` accepts an optional `size` param (24–64). **When absent, it renders at 40px** — the pre-existing behavior — not at the editor's default of 48.
- The README image editor always emits an explicit `size` param (default 48) in generated image sources.
- Generated README image code no longer includes `width="100%"` on the fallback `<img>`; icons display at their true pixel size.

## Consequences

- Every URL already in the wild renders exactly as before.
- The endpoint default (40) and the editor default (48) deliberately differ; this is not a bug.
- The editor preview can honestly claim pixel-exact parity with what the README shows.
- Newly copied README image code renders at intrinsic size; users who relied on `width="100%"` container-stretching will see a change only when they re-copy.

## Alternatives considered

- **Endpoint default 48**: silently resizes every existing README image on cache expiry. Rejected.
- **Keep `width="100%"`**: makes the size slider cosmetic (resolution only) and the preview dishonest. Rejected.
