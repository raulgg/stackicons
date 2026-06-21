import type { Metadata } from "next";
import Script from "next/script";

import { SiteFooter } from "@/app/_components/SiteFooter";
import { SiteHeader } from "@/app/_components/SiteHeader";
import stackIconsLogo from "@/assets/stack-icons-logo.svg";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { uiThemeResetScript } from "@/lib/ui-theme-reset";

import "./globals.css";

export const metadata: Metadata = {
  title: "StackIcons",
  description: "Generate cached SVG stack icon images for GitHub READMEs.",
  icons: {
    icon: [{ url: stackIconsLogo.src, type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Must stay ahead of ThemeProvider so it runs before the
            next-themes init script reads localStorage. See ADR 0003. */}
        <Script id="ui-theme-reset" strategy="beforeInteractive">
          {uiThemeResetScript}
        </Script>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
