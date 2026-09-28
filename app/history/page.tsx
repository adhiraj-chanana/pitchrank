import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HistoryChart } from "./HistoryChart";
import { HoverScale } from "@/components/motion/Hover";
import { PageBackground } from "@/components/PageBackground";
import { AppHeader } from "@/components/AppHeader";
import type { PitchAttempt } from "@/lib/types";

// See app/dashboard/page.tsx — Supabase's fetch calls can otherwise be
// served stale by Next's default fetch cache even in a dynamic route.
export const dynamic = "force-dynamic";

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
      <AppHeader
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/feedback", label: "Feedback" },
          { href: "/about", label: "About" },
        ]}
      />

      <main className="max-w-4xl mx-auto px-6 py-8 pb-20">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">History</h1>

        {typedAttempts.length === 0 ? (
          <div className="bg-surface border-2 border-border rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 text-center">
            <Image
              src="/boss/boss-dismissive.png"
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-border"
            />
            <p className="text-muted font-medium">
              No history yet. Marcus needs at least one pitch to judge before
              there&apos;s anything to look back on.
            </p>
          </div>
        ) : (
          <>
            <HistoryChart data={chartData} />

            <div className="flex flex-col gap-3 mt-8">
              {typedAttempts.map((attempt) => (
                <HoverScale key={attempt.id} scale={1.02} y={-2}>
                  <div className="flex items-center justify-between bg-surface border-2 border-border rounded-2xl shadow-lg px-5 py-4">
                    <div>
                      <div className="text-foreground font-bold">
                        {attempt.scenarios?.title ?? "Scenario"}
                      </div>
                      <div className="text-xs font-medium text-muted mt-0.5">
                        {attempt.date}
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-foreground font-black ${scoreBadgeColor(
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
