import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { PageBackground } from "@/components/PageBackground";
import { HoverScale } from "@/components/motion/Hover";

const stepsDetailed = [
  {
    title: "Get today's scenario",
    description:
      "Every day, a new high-stakes moment lands in your dashboard: a recruiter at a career fair, a VC who's heard it all before, a CEO in an elevator with thirty seconds to spare. No two days are the same, so you can't just memorize your way through it.",
  },
  {
    title: "Record your pitch",
    description:
      "Sixty seconds. No script, no do-overs, no edit button. Just you, your mic, and Marcus watching. That pressure is the point — it's the same pressure you'll feel in the real room.",
  },
  {
    title: "Face the verdict",
    description:
      "Marcus doesn't do generic feedback. He scores your hook, clarity, confidence, and close — and quotes your own words back at you when you hedge, ramble, or bury the ask.",
  },
];

const reasons = [
  {
    title: "You lose it in the first ten seconds",
    description:
      "Most people don't blow the opportunity in the room. They blow it in the opener — the fumbled intro, the rambling explanation, the pitch that trails off instead of landing.",
  },
  {
    title: "Generic advice doesn't fix a specific habit",
    description:
      "\"Be more confident\" isn't feedback. Marcus tells you the exact phrase you hedged on, the exact second you lost the thread, the exact word you should cut.",
  },
  {
    title: "You can't practice this alone",
    description:
      "Rehearsing in your head doesn't reveal the filler words, the pace, the weak close. You need something that reacts to what you actually said — not what you meant to say.",
  },
];

const features = [
  {
    title: "A new scenario, every day",
    description:
      "Networking events, cold recruiters, panel interviews, offer negotiations. The situations escalate as you improve.",
  },
  {
    title: "AI scoring across 6 dimensions",
    description:
      "Hook, clarity, confidence, close, filler words, and pace — not a vague number, a real breakdown of what worked.",
  },
  {
    title: "A boss with moods",
    description:
      "Marcus has good days and bad days. Catch him stressed before a board meeting and he's a lot less forgiving.",
  },
  {
    title: "Streaks that mean something",
    description:
      "Show up daily and unlock harder scenarios. Miss a day and you're back to Beginner — the stakes are real.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageBackground contentClassName="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HEADER */}
        <section className="relative px-6 sm:px-10 pt-20 pb-16 overflow-hidden">
          <div className="relative z-10 w-full max-w-6xl mx-auto grid sm:grid-cols-2 gap-16 items-center">
            <div className="text-center sm:text-left">
              <span className="text-sm font-bold text-highlight uppercase tracking-wide">
                Meet Marcus
              </span>
              <h1 className="font-display mt-3 font-bold text-4xl sm:text-6xl tracking-tight text-foreground text-balance">
                He&apos;s heard 10,000 pitches. He&apos;s still not
                impressed.
              </h1>
              <p className="mt-6 text-lg text-muted font-medium max-w-xl mx-auto sm:mx-0 text-balance">
                Here&apos;s exactly how sixty seconds a day with him turns
                you into someone who doesn&apos;t freeze up when it counts.
              </p>
              <HoverScale scale={1.05} className="inline-block mt-8">
                <Link
                  href="/signup"
                  className="block text-lg font-bold bg-accent hover:bg-accent-hover text-foreground px-10 py-4 rounded-full shadow-lg transition-colors"
                >
                  Start Training Free
                </Link>
              </HoverScale>
            </div>

            <div className="flex justify-center sm:justify-end">
              <HoverScale scale={1.03} rotate={1}>
                <Image
                  src="/boss-landing.png"
                  alt="Marcus, the PitchRank boss, leaning in and ready to judge your pitch"
                  width={1371}
                  height={1147}
                  className="w-full max-w-[440px] h-auto drop-shadow-2xl animate-float"
                  priority
                />
              </HoverScale>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — DETAILED */}
        <section className="w-full py-24 px-6">
          <h2 className="font-display text-center font-bold text-5xl sm:text-6xl text-foreground">
            How it actually works
          </h2>

          <div className="max-w-3xl mx-auto mt-16 flex flex-col gap-12">
            {stepsDetailed.map((step, i) => (
              <HoverScale key={step.title} scale={1.02} y={-4}>
                <div className="flex gap-6 items-start rounded-2xl border-2 border-border bg-surface p-6 sm:p-8">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-accent text-foreground font-black text-xl flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-muted font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* WHY YOU NEED IT */}
        <section className="w-full py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-sm font-bold text-highlight uppercase tracking-wide">
              Why it matters
            </span>
            <h2 className="font-display mt-3 font-bold text-4xl sm:text-5xl text-foreground text-balance">
              Nobody prepares for the moment that actually matters.
            </h2>
          </div>

          <div className="max-w-5xl mx-auto mt-14 grid sm:grid-cols-3 gap-6">
            {reasons.map((reason) => (
              <HoverScale key={reason.title} scale={1.03} y={-6}>
                <div className="h-full rounded-2xl border-2 border-border bg-surface p-6">
                  <h3 className="text-lg font-black text-foreground">
                    {reason.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted font-medium leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="w-full py-24 px-6">
          <h2 className="font-display text-center font-bold text-4xl sm:text-5xl text-foreground text-balance">
            What you actually get
          </h2>

          <div className="max-w-4xl mx-auto mt-14 grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <HoverScale key={feature.title} scale={1.02} y={-4}>
                <div className="h-full rounded-2xl border-2 border-border bg-surface p-6">
                  <h3 className="text-lg font-black text-highlight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-24 px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-balance">
            Marcus is waiting.
          </h2>
          <p className="mt-4 text-lg font-medium text-muted">
            Your first scenario takes sixty seconds. Your excuse doesn&apos;t
            hold up much longer than that.
          </p>
          <HoverScale scale={1.05} className="inline-block mt-8">
            <Link
              href="/signup"
              className="block text-lg font-bold bg-foreground hover:bg-accent-soft text-accent px-10 py-4 rounded-full shadow-lg transition-colors"
            >
              Start Training Free
            </Link>
          </HoverScale>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo theme="light" />
          <p className="text-sm text-muted font-medium text-center">
            Built for people tired of winging it
          </p>
          <p className="text-sm text-muted font-medium">
            © {new Date().getFullYear()} PitchRank
          </p>
        </div>
      </footer>
    </PageBackground>
  );
}
