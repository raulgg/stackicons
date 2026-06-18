"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

// Outline triggers use accent tint on selection. Accent backgrounds must not
// transition (stale-color bugs), so triggers transition color only, never bg.
const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      outline: "gap-1",
      segmented:
        "gap-0 overflow-hidden rounded-[6px] border border-border bg-surface-3",
    },
  },
  defaultVariants: {
    variant: "outline",
  },
});

const tabsTriggerVariants = cva(
  "inline-flex items-center rounded-[6px] px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        outline:
          "border border-input bg-transparent py-1 text-foreground shadow-sm transition-[color] hover:bg-muted data-[state=active]:border-accent data-[state=active]:bg-accent-soft data-[state=active]:text-accent-ink",
        segmented:
          "border border-transparent bg-transparent py-[6px] text-foreground shadow-none transition-[color,background-color,border-color] first:rounded-l-[5px] last:rounded-r-[5px] data-[state=active]:border-border data-[state=active]:bg-card",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

// Propagate list variant to triggers, matching toggle-group composition.
const TabsListContext = React.createContext<
  VariantProps<typeof tabsListVariants>
>({
  variant: "outline",
});

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsListContext.Provider value={{ variant }}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsListContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => {
  const context = React.useContext(TabsListContext);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({ variant: variant ?? context.variant }),
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
