import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CheckboxIndicatorState = "checked" | "unchecked" | "indeterminate";

type CheckboxIndicatorProps = {
  className?: string;
  state: CheckboxIndicatorState;
};

/**
 * Presentational checkbox indicator used for both the interactive picker
 * Checkbox (composed inside Radix Root) and decorative list-row indicators
 * (e.g., inside role="option" rows in the icon picker).
 *
 * Owns the full picker visual surface: size, border, background, rounding,
 * and the check/minus icons. Does not handle focus, disabled, or Radix state.
 */
export function CheckboxIndicator({
  className,
  state,
}: CheckboxIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
        state === "unchecked"
          ? "border-[1.5px] border-border-ink"
          : "bg-accent text-white",
        className,
      )}
    >
      {state === "checked" ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : state === "indeterminate" ? (
        <MinusIcon className="h-3.5 w-3.5" />
      ) : null}
    </span>
  );
}
