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
      className={`relative bg-white rounded-2xl shadow-lg px-5 py-3 animate-bubble-pulse ${className}`}
    >
      <p className="text-sm font-bold text-foreground">{children}</p>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
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
              <h1 className="font-fjalla text-4xl sm:text-6xl tracking-tight text-balance">
                <span className="text-white">Stop winging it.</span>
                <br />
                <span className="text-[#715DF2]">
                  Start pitching like a pro.
                </span>
              </h1>

              <p className="mt-6 text-lg text-white/70 font-medium max-w-xl mx-auto sm:mx-0 text-balance">
                A new high-stakes scenario every day. Record your pitch. Face
                the boss. Get brutally specific feedback on exactly what you
                said wrong.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                <HoverScale scale={1.05}>
                  <Link
                    href="/signup"
                    className="block text-lg font-bold bg-[#6600FF] hover:bg-[#5500d6] text-white px-10 py-4 rounded-full shadow-lg transition-colors"
                  >
                    Start Training Free
                  </Link>
                </HoverScale>
                <HoverScale scale={1.05}>
                  <Link
                    href="#how-it-works"
                    className="block text-lg font-bold text-white/80 hover:text-white px-6 py-4 rounded-full transition-colors"
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

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full py-24 px-6">
          <h2 className="text-center font-fjalla text-6xl sm:text-7xl text-white">
            How PitchRank works
          </h2>

          <div className="relative max-w-4xl mx-auto mt-16 grid sm:grid-cols-3 gap-12 sm:gap-6">
            <div className="hidden sm:block absolute top-8 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-white/25 z-0" />

            {steps.map((step, i) => (
              <HoverScale key={step.title} scale={1.04} y={-6}>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#001220] text-white font-black text-xl flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/70 font-medium leading-relaxed max-w-[240px]">
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
              <span className="text-sm font-bold text-white/80 uppercase tracking-wide">
                Meet your judge
              </span>
              <h2 className="mt-3 text-4xl font-black text-white text-balance">
                He&apos;s heard every excuse in the book.
              </h2>
              <p className="mt-5 text-lg text-white/70 font-medium leading-relaxed text-balance">
                Marcus has sat through 10,000 pitches. He&apos;s a skeptical
                VC who doesn&apos;t sugarcoat anything. Impress him and
                he&apos;ll tell you. Bore him and he&apos;ll tell you that
                too.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {traits.map((trait) => (
                  <span
                    key={trait}
                    className="text-sm font-semibold text-white border-2 border-white/50 rounded-full px-4 py-1.5"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCORE PREVIEW */}
        <section className="w-full py-24 px-6">
          <h2 className="text-center text-3xl sm:text-4xl font-black text-white">
            What your score looks like
          </h2>

          <div className="max-w-xl mx-auto mt-14 bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-8">
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
              <div className="relative bg-white rounded-xl shadow-md px-4 py-2 animate-bubble-pulse">
                <p className="text-xs font-bold text-foreground">
                  Hm. Almost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="w-full py-24 px-6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <HoverScale key={t.author} scale={1.03} y={-6}>
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full">
                  <p className="text-sm text-foreground font-medium leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-bold text-[#6600FF]">
                    {t.author}
                  </p>
                </div>
              </HoverScale>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-24 px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white text-balance">
            Ready to face the boss?
          </h2>
          <p className="mt-4 text-lg font-medium text-white/70">
            Your first scenario is waiting.
          </p>
          <HoverScale scale={1.05} className="inline-block mt-8">
            <Link
              href="/signup"
              className="block text-lg font-bold bg-white hover:bg-[#f2e9ff] text-[#6600FF] px-10 py-4 rounded-full shadow-lg transition-colors"
            >
              Start Training Free
            </Link>
          </HoverScale>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo theme="light" />
          <p className="text-sm text-gray-400 font-medium text-center">
            Built for people tired of winging it
          </p>
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} PitchRank
          </p>
        </div>
      </footer>
    </PageBackground>
  );
}
