import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { PageBackground } from "@/components/PageBackground";

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
              href="/history"
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              History
            </a>
            <a
              href="/feedback"
              className="text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              Feedback
            </a>
            <LogoutButton className="text-sm font-bold text-white/60 hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 pb-20">
        <h1 className="font-black text-3xl text-white mb-2">
          About PitchRank
        </h1>
        <p className="text-white/60 font-medium mb-10">
          Most pitch advice is generic. Ours isn&apos;t.
        </p>

        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-sm font-black text-[#715DF2] uppercase tracking-wide mb-2">
              The problem
            </h2>
            <p className="text-white/80 font-medium leading-relaxed">
              You don&apos;t get better at pitching by reading about it. You
              get better by doing it badly, on purpose, in private, until
              it&apos;s not bad anymore. Most people never get that
              repetition — the recruiter, the investor, the stranger at the
              networking event is the first and only rep they get, and
              there&apos;s no redo.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#715DF2] uppercase tracking-wide mb-2">
              What this is
            </h2>
            <p className="text-white/80 font-medium leading-relaxed">
              PitchRank gives you that repetition. A new high-stakes scenario
              every day, sixty seconds to respond, no script and no
              do-overs. Your pitch gets scored across six dimensions — hook,
              clarity, confidence, close, filler words, and pace — with
              feedback that quotes your own words back at you instead of
              generic advice you&apos;ll forget by tomorrow.
            </p>
          </section>

          <section className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border-2 border-white/10 bg-white/5 p-6">
            <Image
              src="/boss/boss-impressed.png"
              alt="Marcus, the PitchRank boss"
              width={100}
              height={100}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shrink-0"
            />
            <div>
              <h2 className="text-sm font-black text-[#715DF2] uppercase tracking-wide mb-2">
                Who&apos;s judging you
              </h2>
              <p className="text-white/80 font-medium leading-relaxed">
                Marcus is the skeptical VC who&apos;s sat through 10,000
                pitches and isn&apos;t easily impressed. He has good days
                and bad days, he reacts to what you actually said, and he
                won&apos;t pretend a weak opener was fine just to spare your
                feelings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#715DF2] uppercase tracking-wide mb-2">
              Why daily
            </h2>
            <p className="text-white/80 font-medium leading-relaxed">
              One pitch a day builds a streak, and the streak is the whole
              point. Confidence under pressure isn&apos;t something you read
              your way into — it&apos;s something you rep your way into.
              Show up daily and the scenarios get harder. Skip a day and the
              streak resets. That&apos;s deliberate.
            </p>
          </section>
        </div>
      </main>
    </PageBackground>
  );
}
