import { StackIconsLogo } from "@/components/StackIconsLogo";
import { cn } from "@/lib/utils";

type StackIconsBrandProps = {
  className?: string;
  variant: "compact" | "full";
};

export function StackIconsBrand({ className, variant }: StackIconsBrandProps) {
  if (variant === "compact") {
    return (
      <span className={cn("flex items-center gap-3", className)}>
        <StackIconsLogo size={22} />
        <span className="text-[13px] font-semibold text-foreground">
          StackIcons
        </span>
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <StackIconsLogo />
      <span>
        <span className="mb-2 block text-[27px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
          Stack<span className="text-accent-ink">Icons</span>
        </span>
        <span className="block font-mono text-[12px] uppercase leading-none text-ink-3">
          Tech Stack Icons Composer
        </span>
      </span>
    </span>
  );
}
