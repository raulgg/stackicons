import React from "react";

type BrandMarkProps = {
  className?: string;
};

/**
 * StackIcons logo mark: a 2x2 grid of accent tiles on a soft accent plate.
 * Fills use the Primer token custom properties so the mark adapts to the
 * active UI theme.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={44}
      viewBox="0 0 36 36"
      width={44}
    >
      <rect
        fill="hsl(var(--accent-soft))"
        height="30"
        rx="9"
        width="30"
        x="3"
        y="3"
      />
      <rect
        fill="hsl(var(--accent))"
        height="8"
        rx="2.5"
        width="8"
        x="9"
        y="9"
      />
      <rect
        fill="hsl(var(--accent-bright))"
        height="8"
        rx="2.5"
        width="8"
        x="19"
        y="9"
      />
      <rect
        fill="hsl(var(--accent-bright))"
        height="8"
        rx="2.5"
        width="8"
        x="9"
        y="19"
      />
      <rect
        fill="hsl(var(--accent))"
        height="8"
        rx="2.5"
        width="8"
        x="19"
        y="19"
      />
    </svg>
  );
}
