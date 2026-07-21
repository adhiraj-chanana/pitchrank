import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-border">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 max-w-6xl mx-auto w-full">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="text-sm font-bold text-muted hover:text-foreground transition-colors px-4 py-2.5 rounded-full"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-bold bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
