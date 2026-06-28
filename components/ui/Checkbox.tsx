"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, MinusIcon } from "lucide-react";

import {
  CheckboxIndicator,
  type CheckboxIndicatorState,
} from "./CheckboxIndicator";
import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "group peer grid shrink-0 place-content-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-4 w-4 rounded-sm border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        picker: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function getIndicatorState(
  checked: boolean | "indeterminate" | undefined,
): CheckboxIndicatorState {
  if (checked === true) return "checked";
  if (checked === "indeterminate") return "indeterminate";
  return "unchecked";
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
    VariantProps<typeof checkboxVariants>
>(({ className, variant, checked, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      className={cn(checkboxVariants({ variant, className }))}
      ref={ref}
      {...props}
    >
      {variant === "picker" ? (
        <CheckboxIndicator state={getIndicatorState(checked)} />
      ) : (
        <CheckboxPrimitive.Indicator
          className={cn("grid place-content-center text-current")}
        >
          <CheckIcon
            className={cn("h-4 w-4", "group-data-[state=indeterminate]:hidden")}
          />
          <MinusIcon
            className={cn(
              "h-4 w-4",
              "hidden group-data-[state=indeterminate]:block",
            )}
          />
        </CheckboxPrimitive.Indicator>
      )}
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
