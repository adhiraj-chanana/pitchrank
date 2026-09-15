import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-[#001220]/60 border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 max-w-6xl mx-auto w-full">
        <Logo theme="light" />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="text-sm font-bold text-white/60 hover:text-white transition-colors px-4 py-2.5 rounded-full"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-bold bg-[#6600FF] hover:bg-[#5500d6] text-white px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
