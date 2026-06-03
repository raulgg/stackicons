import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "README Stack Icons",
  description: "Generate cached SVG stack icon images for GitHub README embeds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
