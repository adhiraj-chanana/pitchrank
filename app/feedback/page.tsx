import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { relativeDate } from "@/lib/date";
import { ScoreBar } from "@/components/ScoreBar";
import { HoverScale } from "@/components/motion/Hover";
import { PageBackground } from "@/components/PageBackground";
import { AppHeader } from "@/components/AppHeader";
import type { PitchAttempt } from "@/lib/types";

function scoreBadgeColor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

export default async function FeedbackPage() {
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
    .order("created_at", { ascending: false });

  const typedAttempts =
    (attempts as (PitchAttempt & { scenarios: { title: string } | null })[]) ??
    [];

  return (
    <PageBackground>
      <AppHeader
        links={[
          { href: "/history", label: "History" },
          { href: "/feedback", label: "Feedback" },
          { href: "/about", label: "About" },
        ]}
      />

      <main className="max-w-4xl mx-auto px-6 py-8 pb-20">
        <h1 className="font-black text-3xl text-white mb-2">
          Your feedback history
        </h1>
        <p className="text-white/60 font-medium mb-8">
          Every note Marcus has left you. Read them. Learn from them.
        </p>

        {typedAttempts.length === 0 ? (
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 text-center">
            <Image
              src="/boss/boss-dismissive.png"
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
            />
            <p className="text-white/60 font-medium">
              No feedback yet. Complete your first pitch to see Marcus&apos;s
              notes here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {typedAttempts.map((attempt) => {
              const score = attempt.score;
              const scenarioTitle = attempt.scenarios?.title ?? "Scenario";

              return (
                <HoverScale key={attempt.id} scale={1.01} y={-2}>
                <div
                  className="bg-white/5 border-2 border-white/10 rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="text-white font-bold text-lg">
                        {scenarioTitle}
                      </div>
                      <div className="text-xs font-medium text-white/50 mt-0.5">
                        {relativeDate(attempt.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {score?.mood?.emoji && (
                        <span className="text-2xl leading-none" title={score.mood.name}>
                          {score.mood.emoji}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-white font-black text-sm ${scoreBadgeColor(
                          score?.overall ?? 0
                        )}`}
                      >
                        {score?.overall ?? "—"}
                      </span>
                    </div>
                  </div>

                  {!score ? (
                    <p className="text-sm text-white/60 font-medium">
                      No score recorded for this attempt.
                    </p>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3 mb-5">
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar variant="dark" label="Hook" value={score.dimensions.hook} />
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar
                            variant="dark"
                            label="Clarity"
                            value={score.dimensions.clarity}
                          />
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar
                            variant="dark"
                            label="Confidence"
                            value={score.dimensions.confidence}
                          />
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar variant="dark" label="Close" value={score.dimensions.close} />
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar variant="dark" label="Filler" value={score.filler_penalty} />
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                          <ScoreBar variant="dark" label="Pace" value={score.pace_score} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-white">
                            {score.filler_words}
                          </div>
                          <div className="text-xs font-bold text-white/50 mt-1 uppercase tracking-wide">
                            Filler words
                          </div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-white">
                            {score.wpm}
                          </div>
                          <div className="text-xs font-bold text-white/50 mt-1 uppercase tracking-wide">
                            Words per minute
                          </div>
                        </div>
                      </div>

                      <div className="mb-5">
                        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-wide">
                          What Marcus noticed
                        </h3>
                        <div className="flex flex-col gap-2">
                          {score.feedback.map((point, i) => (
                            <div
                              key={i}
                              className="bg-white/10 shadow-sm border-l-4 border-l-[#6600FF] rounded-xl p-3"
                            >
                              <p className="text-sm text-white font-medium">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {score.strong_moments.length > 0 && (
                        <div className="mb-5">
                          <h3 className="text-xs font-black text-white mb-2 uppercase tracking-wide">
                            What worked
                          </h3>
                          <div className="flex flex-col gap-2">
                            {score.strong_moments.map((point, i) => (
                              <div
                                key={i}
                                className="bg-success/10 border-l-4 border-l-success shadow-sm rounded-xl p-3"
                              >
                                <p className="text-sm text-white font-medium">
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {score.hedging_phrases.length > 0 && (
                        <div className="mb-5">
                          <h3 className="text-xs font-black text-white mb-2 uppercase tracking-wide">
                            Words to eliminate
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {score.hedging_phrases.map((phrase, i) => (
                              <span
                                key={i}
                                className="bg-danger/15 text-danger text-sm font-bold px-4 py-2 rounded-full"
                              >
                                &ldquo;{phrase}&rdquo;
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <details className="group">
                        <summary className="cursor-pointer text-sm font-bold text-[#715DF2] select-none list-none">
                          <span className="group-open:hidden">
                            Show transcript ▼
                          </span>
                          <span className="hidden group-open:inline">
                            Hide transcript ▲
                          </span>
                        </summary>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-white/70 font-medium bg-black/20 rounded-xl p-4 leading-relaxed">
                          {attempt.transcript ?? ""}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
                </HoverScale>
              );
            })}
          </div>
        )}
      </main>
    </PageBackground>
  );
}
