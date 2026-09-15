import type { Metadata } from "next";
import { Fjalla_One } from "next/font/google";
import "./globals.css";

const fjallaOne = Fjalla_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fjalla",
  display: "swap",
});

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
    <html lang="en" className={fjallaOne.variable}>
      <body className="antialiased bg-background text-foreground min-h-screen font-medium">
        {children}
      </body>
    </html>
  );
}
