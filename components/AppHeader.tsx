"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

type NavItem = { href: string; label: string };

/**
 * Shared header for the logged-in app pages (dashboard, history, feedback,
 * about) — inline nav on desktop, hamburger + dropdown on mobile. `links`
 * lets each page pass its own set (they each omit the page they're on).
 */
export function AppHeader({ links }: { links: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative w-full border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
        <Logo href="/dashboard" theme="light" />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <LogoutButton className="text-sm font-bold text-white/60 hover:text-white transition-colors" />
        </nav>

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="app-nav-menu"
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
            id="app-nav-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="sm:hidden absolute left-0 right-0 top-full z-20 border-t border-white/10 bg-[#001220]/95 backdrop-blur-md shadow-xl"
          >
            <nav className="flex flex-col gap-2 px-6 py-4">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-bold text-white/80 hover:text-white hover:bg-white/5 transition-colors px-4 py-3 rounded-xl"
                >
                  {item.label}
                </Link>
              ))}
              <div
                className="px-4 py-3"
                onClick={() => setOpen(false)}
              >
                <LogoutButton className="text-base font-bold text-white/80 hover:text-white transition-colors" />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
