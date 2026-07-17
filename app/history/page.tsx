import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { HistoryChart } from "./HistoryChart";
import type { PitchAttempt } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: attempts } = await supabase
    .from("pitch_attempts")
    .select("*, scenarios(title)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const typedAttempts =
    (attempts as (PitchAttempt & { scenarios: { title: string } | null })[]) ??
    [];

  const chartData = [...typedAttempts]
    .reverse()
    .map((a) => ({ date: a.date, score: a.score?.overall ?? 0 }));

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-6">
          <a
            href="/dashboard"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <h1 className="text-2xl font-bold text-white mb-6">History</h1>

        {typedAttempts.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-muted">
              No attempts yet. Record your first pitch to start your history.
            </p>
          </div>
        ) : (
          <>
            <HistoryChart data={chartData} />

            <div className="flex flex-col gap-3 mt-8">
              {typedAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-4"
                >
                  <div>
                    <div className="text-white font-medium">
                      {attempt.scenarios?.title ?? "Scenario"}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {attempt.date}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-accent">
                    {attempt.score?.overall ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
