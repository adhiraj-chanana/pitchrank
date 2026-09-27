import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { TimezoneSync } from "@/components/TimezoneSync";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PitchRank",
  description: "Practice pitching. Every day.",
};

// viewportFit: "cover" lets the app draw edge-to-edge on notched devices —
// safe-area-inset-* env() values only become non-zero with this set, which
// the sticky nav and full-screen modals rely on.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={displayFont.variable}>
      <body className="antialiased bg-background text-foreground min-h-screen font-medium">
        <TimezoneSync />
        {children}
      </body>
    </html>
  );
}
