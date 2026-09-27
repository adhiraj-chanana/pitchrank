"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-[#001220]/60 border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 max-w-6xl mx-auto w-full">
        <Logo theme="light" />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
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

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          className="sm:hidden relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <motion.span
            className="absolute h-0.5 w-5 bg-white rounded-full"
            animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute h-0.5 w-5 bg-white rounded-full"
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <motion.span
            className="absolute h-0.5 w-5 bg-white rounded-full"
            animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="sm:hidden absolute left-0 right-0 top-full border-t border-white/10 bg-[#001220]/95 backdrop-blur-md shadow-xl"
          >
            <nav className="flex flex-col gap-2 px-6 py-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-base font-bold text-white/80 hover:text-white hover:bg-white/5 transition-colors px-4 py-3 rounded-xl"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="text-base font-bold bg-[#6600FF] hover:bg-[#5500d6] text-white px-4 py-3 rounded-xl text-center shadow-lg transition-colors"
              >
                Start Free
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
