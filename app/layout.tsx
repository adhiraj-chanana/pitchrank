import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchRank",
  description: "Practice pitching. Every day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen font-medium">
        {children}
      </body>
    </html>
  );
}
