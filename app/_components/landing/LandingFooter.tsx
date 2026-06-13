import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";

export function LandingFooter() {
  return (
    <footer className="flex items-center gap-3 border-t border-border px-10 py-[18px] max-[760px]:px-5 max-[760px]:py-4">
      <BrandMark size={22} />
      <span className="text-[13px] font-semibold text-foreground">
        StackIcons
      </span>
      <div className="ml-auto flex items-center gap-[18px] font-mono text-[11px] text-ink-3">
        <Link href="/editor" className="hover:text-foreground hover:underline">
          editor
        </Link>
        <span className="max-[760px]:hidden">logos by simpleicons.org</span>
      </div>
    </footer>
  );
}

export default LandingFooter;
