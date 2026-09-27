"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { PageBackground } from "@/components/PageBackground";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const redirectTo =
      new URLSearchParams(window.location.search).get("redirectTo") ||
      "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <PageBackground contentClassName="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="mb-8">
        <Logo theme="light" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm bg-surface border-[3px] border-accent rounded-3xl shadow-lg p-8"
      >
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted font-medium mb-6">
          Log in to keep your streak alive.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-bold text-muted mb-1.5"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              className="block text-sm font-bold text-muted mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-bold text-danger">{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="mt-2 w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-foreground font-bold py-3 rounded-full shadow-lg transition-colors"
          >
            {loading ? "Logging in..." : "Log in"}
          </motion.button>
        </form>

        <p className="mt-6 text-sm text-muted font-medium text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-highlight font-bold hover:text-foreground transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </PageBackground>
  );
}
