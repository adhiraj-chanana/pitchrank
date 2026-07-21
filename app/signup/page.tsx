"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // If email confirmation is required there will be no session yet.
    if (!data.session) {
      setLoading(false);
      setError(
        "Check your email to confirm your account, then log in."
      );
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm bg-surface border-[3px] border-accent rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-foreground mb-1">
          Create your account
        </h1>
        <p className="text-sm text-muted font-medium mb-6">
          Start your daily pitch streak today.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-bold text-muted mb-1.5"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Ada Lovelace"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-bold text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3 rounded-full shadow-lg transition-all hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted font-medium text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-bold hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
