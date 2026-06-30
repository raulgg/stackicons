# Writing Unit Tests

We write unit tests in **Given – When – Then** form: set up context, perform the action, assert the outcome. Test names and structure should make that flow obvious without reading every line.

## File location and naming

Colocate unit tests **next to** the file under test. Use the same base name with a `.test` suffix before the extension.

| Source           | Test                  |
| ---------------- | --------------------- |
| `Button.tsx`     | `Button.test.tsx`     |
| `useAuth.ts`     | `useAuth.test.ts`     |
| `format-slug.ts` | `format-slug.test.ts` |
| `icons/route.ts` | `icons/route.test.ts` |

This applies to components, hooks, utilities, services, API route handlers, and any other unit under test.

Global Vitest setup (shared matchers, mocks) lives in `vitest.setup.ts` — not individual unit tests.

## Tooling

- Use Vitest (`describe`, `it`, `expect`) and `@testing-library/react` for components.
- Prefer queries by **role**, **label**, or **accessible name** over test IDs or DOM structure.
- Global matchers come from `@testing-library/jest-dom` via `vitest.setup.ts`.

## Structure

**`describe`** — names the **unit under test** (component, hook, or pure function).

**`it`** — names one scenario using:

```text
should [expected outcome] when [action or state change]
```

Inside the test, separate the three phases with comments (or blank lines). Keep each phase focused on one concern.

| Phase | Responsibility                                     |
| ----- | -------------------------------------------------- |
| Given | Arrange: render, seed props/state, mocks, fixtures |
| When  | Act: user events, calls, state updates             |
| Then  | Assert: visible outcome, callbacks, return values  |

When **rendering alone** is the action (e.g. mounting a page), **When** can be a short comment or folded into Given; still name the `it` with the `when` clause.

## Example

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("should show the StackIcons heading when the root page renders", () => {
    // Given
    render(<Home />);

    // When — visitor lands on the root page (render is the action)

    // Then
    expect(
      screen.getByRole("heading", { name: "StackIcons" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Icon slugs")).toBeInTheDocument();
  });
});
```

## Hooks and non-UI code

Use the same naming pattern; swap `render` for `renderHook` or direct function calls.

```tsx
describe("useExample", () => {
  it("should return the initial count when mounted with no options", () => {
    // Given / When
    const { result } = renderHook(() => useExample());

    // Then
    expect(result.current.count).toBe(0);
  });
});
```

## Guidelines

- **One logical behavior per test.** Multiple `expect` calls are fine when they describe the same outcome.
- **Avoid** testing implementation details (internal state, private functions, class names) unless they are the contract.
- **Prefer** user-visible behavior and public APIs.
- **Do not** assert on snapshot dumps of large trees unless a snapshot is explicitly the right tool.

