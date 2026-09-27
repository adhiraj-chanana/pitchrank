import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { ScoreBar } from "@/components/ScoreBar";
import { HoverScale } from "@/components/motion/Hover";
import { PageBackground } from "@/components/PageBackground";

const steps = [
  {
    title: "Get your scenario",
    description:
      "Every day a new high-stakes situation drops. A skeptical VC. A cold recruiter. An elevator ride with a CEO.",
  },
  {
    title: "Record your pitch",
    description:
      "60 seconds. No script. Just you and the microphone. The boss is watching.",
  },
  {
    title: "Face the verdict",
    description:
      "The boss reacts to YOUR specific words. AI scores your hook, clarity, confidence, and close.",
  },
];

const traits = ["Brutally honest", "Specific feedback", "Reacts to YOUR words"];

const tierMilestones = [
  { day: "Day 1", label: "Beginner" },
  { day: "Day 7", label: "Intermediate" },
  { day: "Day 14", label: "Advanced" },
  { day: "Day 30", label: "Expert" },
];

const testimonials = [
  {
    quote:
      "I bombed my first pitch to the boss. By week 3 I was getting 80s. Got a referral from a networking event last Tuesday.",
    author: "CS student, Michigan State",
  },
  {
    quote:
      "The feedback is uncomfortably specific. It quoted my exact words back at me. I haven't said 'um' since.",
    author: "Software engineer, job hunting",
  },
  {
    quote:
      "I use it before every networking event. It's the only thing that actually made me less awkward.",
    author: "Product manager, NYC",
  },
];

function SpeechBubble({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-foreground rounded-2xl shadow-lg px-5 py-3 animate-bubble-pulse ${className}`}
    >
      <p className="text-sm font-bold text-background">{children}</p>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-foreground rotate-45" />
    </div>
  );
}

export default function Home() {
  return (
    <PageBackground contentClassName="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center px-6 sm:px-10 overflow-hidden">
          <div className="relative z-10 w-full max-w-6xl mx-auto grid sm:grid-cols-2 gap-16 items-center py-16">
            <div className="text-center sm:text-left animate-fade-in-up">
              <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-tight text-balance">
                <span className="text-foreground">Stop winging it.</span>
                <br />
                <span className="text-highlight">
                  Start pitching like a pro.
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted font-medium max-w-xl mx-auto sm:mx-0 text-balance">
                A new high-stakes scenario every day. Record your pitch. Face
                the boss. Get brutally specific feedback on exactly what you
                said wrong.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                <HoverScale scale={1.05}>
                  <Link
                    href="/signup"
                    className="block text-lg font-bold bg-accent hover:bg-accent-hover text-foreground px-10 py-4 rounded-full shadow-lg transition-colors"
                  >
                    Start Training Free
                  </Link>
                </HoverScale>
                <HoverScale scale={1.05}>
                  <Link
                    href="#how-it-works"
                    className="block text-lg font-bold text-muted hover:text-foreground px-6 py-4 rounded-full transition-colors"
                  >
                    See how it works ↓
                  </Link>
                </HoverScale>
              </div>
            </div>

            <div className="relative flex justify-center sm:justify-end">
              <div className="relative z-10 flex flex-col items-center">
                <SpeechBubble className="mb-6">
                  I&apos;ve heard better pitches from interns.
                </SpeechBubble>

                <HoverScale scale={1.03} rotate={-1}>
                  <Image
                    src="/boss-landing.png"
                    alt="The PitchRank boss, leaning in and ready to judge your pitch"
                    width={1371}
                    height={1147}
                    className="w-full max-w-[560px] h-auto drop-shadow-2xl animate-float"
                    priority
                  />
                </HoverScale>
              </div>
            </div>
          </div>
        </section>

        {/* PAIN POINT */}
        <section className="w-full py-24 px-6">
          <div className="max-w-3xl mx-auto text-center sm:text-left">
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-foreground text-balance">
              Have you ever been in the room and just&hellip; blanked?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-muted font-medium leading-relaxed text-balance">
              The recruiter asks what you do. The investor gives you sixty
              seconds. The stranger at the networking event is already
              glancing past you. And you open with &ldquo;so, um, I&apos;m a
              student at...&rdquo; — and just like that, the moment&apos;s
              gone.
            </p>
            <p className="mt-5 text-lg sm:text-xl text-highlight font-bold text-balance">
              You don&apos;t get a second first impression. So get the first
              one right.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full py-24 px-6">
          <h2 className="font-display text-center font-bold text-6xl sm:text-7xl text-foreground">
            How PitchRank works
          </h2>

          <div className="relative max-w-4xl mx-auto mt-16 grid sm:grid-cols-3 gap-12 sm:gap-6">
            <div className="hidden sm:block absolute top-8 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-border z-0" />

            {steps.map((step, i) => (
              <HoverScale key={step.title} scale={1.04} y={-6}>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-background text-foreground font-black text-xl flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted font-medium leading-relaxed max-w-[240px]">
                    {step.description}
                  </p>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* BOSS SECTION */}
        <section className="w-full py-24 px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <SpeechBubble className="mb-6 max-w-xs text-center">
                  Your opener was weak. I&apos;ve heard &ldquo;I&apos;m a
                  student at...&rdquo; five hundred times today.
                </SpeechBubble>
                <Image
                  src="/boss-attentive-nobkg.png"
                  alt="The boss, paying close attention"
                  width={1230}
                  height={1278}
                  className="w-full max-w-[440px] h-auto drop-shadow-2xl animate-float"
                />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-sm font-bold text-muted uppercase tracking-wide">
                Meet your judge
              </span>
              <h2 className="font-display mt-3 text-4xl font-bold text-foreground text-balance">
                He&apos;s heard every excuse in the book.
              </h2>
              <p className="mt-5 text-lg text-muted font-medium leading-relaxed text-balance">
                Marcus has sat through 10,000 pitches. He&apos;s a skeptical
                VC who doesn&apos;t sugarcoat anything. Impress him and
                he&apos;ll tell you. Bore him and he&apos;ll tell you that
                too.
              </p>
              <p className="mt-6 text-sm font-semibold text-foreground text-center sm:text-left">
                {traits.map((trait, i) => (
                  <span key={trait}>
                    {trait}
                    {i < traits.length - 1 && (
                      <span className="text-muted mx-2">&middot;</span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* SCORE PREVIEW */}
        <section className="w-full py-24 px-6">
          <h2 className="font-display text-center text-3xl sm:text-4xl font-bold text-foreground">
            What your score looks like
          </h2>

          <div className="max-w-xl mx-auto mt-14 bg-foreground rounded-3xl border-2 border-border shadow-2xl p-8">
            <div className="text-center">
              <div className="text-8xl font-black text-warning leading-none">
                74
              </div>
              <div className="text-sm font-bold text-muted mt-2 uppercase tracking-wide">
                Overall score
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              <ScoreBar label="Hook" value={7} />
              <ScoreBar label="Clarity" value={8} />
              <ScoreBar label="Confidence" value={5} />
              <ScoreBar label="Close" value={6} />
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
              <div className="relative shrink-0">
                <Image
                  src="/boss/boss-interested.png"
                  alt="The boss, mildly interested"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border"
                />
              </div>
              <div className="relative bg-foreground rounded-xl shadow-md px-4 py-2 animate-bubble-pulse">
                <p className="text-xs font-bold text-background">
                  Hm. Almost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STREAK */}
        <section className="w-full py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-sm font-bold text-highlight uppercase tracking-wide">
              Built to keep you coming back
            </span>
            <h2 className="font-display mt-3 font-bold text-4xl sm:text-6xl text-foreground text-balance">
              Build a streak. Become someone who doesn&apos;t choke.
            </h2>
            <p className="mt-5 text-lg text-muted font-medium max-w-xl mx-auto text-balance">
              One pitch a day. That&apos;s it. Miss a day and the streak
              resets — so does your excuse for still winging it.
            </p>

            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 divide-x-0 sm:divide-x-2 divide-border border-2 border-border rounded-2xl overflow-hidden">
              {tierMilestones.map((t) => (
                <div key={t.label} className="px-4 py-6 border-b-2 sm:border-b-0 border-border last:border-b-0">
                  <div className="text-2xl sm:text-3xl font-black text-accent">
                    {t.day}
                  </div>
                  <div className="mt-1 text-sm font-bold text-muted uppercase tracking-wide">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-10 text-muted font-medium max-w-lg mx-auto text-balance">
              Every tier unlocks harder scenarios. By Expert, you&apos;re not
              practicing anymore — you&apos;re just good.
            </p>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="w-full py-24 px-6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <HoverScale key={t.author} scale={1.03} y={-6}>
                <div className="bg-foreground rounded-2xl shadow-lg p-6 flex flex-col h-full">
                  <p className="text-sm text-background font-medium leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-bold text-accent">
                    {t.author}
                  </p>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-24 px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-balance">
            Ready to face the boss?
          </h2>
          <p className="mt-4 text-lg font-medium text-muted">
            Your first scenario is waiting.
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
