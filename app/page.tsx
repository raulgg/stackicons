import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { CatalogStrip } from "./_components/landing/CatalogStrip";
import { DemoCard } from "./_components/landing/DemoCard";
import { LandingFooter } from "./_components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section
          className="mx-auto grid w-full max-w-[1240px] grid-cols-[1.04fr_0.96fr] items-center gap-14 px-14 pb-12 pt-14
                     max-[1020px]:grid-cols-1 max-[1020px]:gap-9 max-[1020px]:px-10 max-[1020px]:pb-10 max-[1020px]:pt-12
                     max-[760px]:px-[22px] max-[760px]:pb-[34px] max-[760px]:pt-[38px]"
        >
          {/* Left column */}
          <div>
            <h1
              className="text-[46px] font-semibold leading-[1.07] tracking-[-0.02em] text-foreground
                         max-[1020px]:text-[40px] max-[760px]:text-[33px]"
            >
              Show off your stack.
            </h1>
            <p className="mt-[18px] max-w-[54ch] text-[17px] leading-[1.55] text-ink-2">
              Pick icons, set a grid, copy one{" "}
              <code className="rounded border border-border bg-surface-2 px-[5px] py-[1px] font-mono text-[0.86em]">
                &lt;picture&gt;
              </code>{" "}
              element into your README. Responsive and dark-mode aware — no
              badges, no build step.
            </p>
            <div className="mt-7">
              <Link
                href="/editor"
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-[6px] border border-black/10 bg-primary px-5 py-[13px] text-[15px] font-semibold text-primary-foreground shadow-button hover:bg-primary/90"
              >
                Create my stack
                <ArrowRightIcon
                  aria-hidden
                  size={16}
                  strokeWidth={2}
                  className="transition-transform duration-[140ms] group-hover:translate-x-[2px]"
                />
              </Link>
            </div>
            <div className="mt-[22px] flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] leading-[1.7] text-ink-3">
              <span>
                <strong className="font-semibold text-ink-2">responsive</strong>{" "}
                — up to 3 breakpoints, one &lt;source&gt; each
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-ink-2">dark-mode</strong>{" "}
                — prefers-color-scheme picks the render
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-ink-2">zero deps</strong>{" "}
                — plain HTML, no account, no build step
              </span>
            </div>
          </div>

          {/* Right column */}
          <div className="w-full max-[1020px]:mx-auto max-[1020px]:max-w-[600px]">
            <DemoCard />
          </div>
        </section>
        <CatalogStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
