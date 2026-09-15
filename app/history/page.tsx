import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { HistoryChart } from "./HistoryChart";
import { HoverScale } from "@/components/motion/Hover";
import { PageBackground } from "@/components/PageBackground";
import type { PitchAttempt } from "@/lib/types";

function scoreBadgeColor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

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
    <PageBackground>
      <header className="w-full border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
          <Logo href="/dashboard" theme="light" />
          <div className="flex items-center gap-6">
            <a
              href="/dashboard"
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/feedback"
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              Feedback
            </a>
            <a
              href="/about"
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              About
            </a>
            <LogoutButton className="text-sm font-bold text-white/60 hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-20">
        <h1 className="text-2xl font-black text-white mb-6">History</h1>

        {typedAttempts.length === 0 ? (
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl shadow-lg p-10 text-center">
            <p className="text-white/60 font-medium">
              No attempts yet. Record your first pitch to start your history.
            </p>
          </div>
        ) : (
          <>
            <HistoryChart data={chartData} />

            <div className="flex flex-col gap-3 mt-8">
              {typedAttempts.map((attempt) => (
                <HoverScale key={attempt.id} scale={1.02} y={-2}>
                  <div className="flex items-center justify-between bg-white/5 border-2 border-white/10 rounded-2xl shadow-lg px-5 py-4">
                    <div>
                      <div className="text-white font-bold">
                        {attempt.scenarios?.title ?? "Scenario"}
                      </div>
                      <div className="text-xs font-medium text-white/50 mt-0.5">
                        {attempt.date}
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-white font-black ${scoreBadgeColor(
                        attempt.score?.overall ?? 0
                      )}`}
                    >
                      {attempt.score?.overall ?? "—"}
                    </div>
                  </div>
                </HoverScale>
              ))}
            </div>
          </>
        )}
      </main>
    </PageBackground>
  );
}
