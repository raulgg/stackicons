import type { Metadata } from "next";

import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { uiThemeResetScript } from "@/lib/ui-theme-reset";

import "./globals.css";

export const metadata: Metadata = {
  title: "StackIcons",
  description: "Generate cached SVG stack icon images for GitHub READMEs.",
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
        <script dangerouslySetInnerHTML={{ __html: uiThemeResetScript }} />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
