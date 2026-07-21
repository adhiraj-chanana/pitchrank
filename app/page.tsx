import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { ScoreBar } from "@/components/ScoreBar";

const avatars = [
  { initial: "A", color: "bg-accent" },
  { initial: "M", color: "bg-warning" },
  { initial: "J", color: "bg-success" },
  { initial: "R", color: "bg-danger" },
  { initial: "K", color: "bg-purple-500" },
];

const stats = [
  { value: "10,000+", label: "Pitches scored" },
  { value: "6", label: "dimensions analyzed" },
  { value: "New", label: "scenario every day" },
];

const steps = [
  {
    emoji: "🎤",
    title: "Get your scenario",
    description:
      "Every day a new high-stakes situation drops. A skeptical VC. A cold recruiter. An elevator ride with a CEO.",
  },
  {
    emoji: "🤖",
    title: "Record your pitch",
    description:
      "60 seconds. No script. Just you and the microphone. The boss is watching.",
  },
  {
    emoji: "📈",
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

// The boss portraits are illustrated against a solid black backdrop baked
// into the PNG itself, so removing the old card wrapper alone still leaves
// a hard rectangle. Fading the edges with a mask lets the character sit
// directly on the page instead.
const bossMaskStyle: React.CSSProperties = {
  maskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 62%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 62%)",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section
          className="relative min-h-screen flex items-center px-6 sm:px-10 overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at top right, rgba(79,70,229,0.10), transparent 60%)",
          }}
        >
          <div className="w-full max-w-6xl mx-auto grid sm:grid-cols-2 gap-16 items-center py-16">
            <div className="text-center sm:text-left animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                🎯 Daily pitch training
              </span>

              <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight text-balance">
                <span className="text-foreground">Stop winging it.</span>
                <br />
                <span className="text-accent">
                  Start pitching like a pro.
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted font-medium max-w-xl mx-auto sm:mx-0 text-balance">
                A new high-stakes scenario every day. Record your pitch. Face
                the boss. Get brutally specific feedback on exactly what you
                said wrong.
              </p>

              <div className="mt-6 flex items-center justify-center sm:justify-start gap-3">
                <div className="flex -space-x-2">
                  {avatars.map((a) => (
                    <div
                      key={a.initial}
                      className={`w-8 h-8 rounded-full ${a.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {a.initial}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted font-medium">
                  Join 500+ people already training
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                <Link
                  href="/signup"
                  className="text-lg font-bold bg-accent hover:bg-accent-hover text-white px-10 py-4 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  Start Training Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-lg font-bold text-accent hover:text-accent-hover px-6 py-4 rounded-full transition-colors"
                >
                  See how it works ↓
                </Link>
              </div>

              <p className="mt-5 text-sm text-muted">
                Free forever · No credit card · 1 pitch per day
              </p>
            </div>

            <div className="relative flex justify-center sm:justify-end">
              <div className="absolute z-0 w-96 h-96 rounded-full bg-indigo-500 opacity-10" />

              <div className="relative z-10 flex flex-col items-center">
                <SpeechBubble className="mb-6">
                  I&apos;ve heard better pitches from interns.
                </SpeechBubble>

                <div className="rotate-2">
                  <Image
                    src="/boss/boss-excited.png"
                    alt="The PitchRank boss, hyped and ready to hear your pitch"
                    width={380}
                    height={380}
                    className="w-full max-w-[340px] h-auto drop-shadow-2xl animate-float"
                    style={bossMaskStyle}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="w-full py-14 bg-[#eef2ff]">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-indigo-200">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 w-full text-center py-6 sm:py-0 px-8"
              >
                <div className="text-4xl font-black text-accent">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-muted mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full bg-white py-24 px-6">
          <h2 className="text-center text-4xl font-black text-foreground">
            How PitchRank works
          </h2>

          <div className="relative max-w-4xl mx-auto mt-16 grid sm:grid-cols-3 gap-12 sm:gap-6">
            <div className="hidden sm:block absolute top-8 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-indigo-200 z-0" />

            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-accent text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {i + 1}
                </div>
                <span className="mt-4 text-3xl">{step.emoji}</span>
                <h3 className="mt-3 text-lg font-black text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted font-medium leading-relaxed max-w-[240px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BOSS SECTION */}
        <section className="w-full bg-[#f9fafb] py-24 px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <SpeechBubble className="mb-6 max-w-xs text-center">
                  Your opener was weak. I&apos;ve heard &ldquo;I&apos;m a
                  student at...&rdquo; five hundred times today.
                </SpeechBubble>
                <Image
                  src="/boss/boss-attentive.png"
                  alt="The boss, paying close attention"
                  width={340}
                  height={340}
                  className="w-full max-w-[300px] h-auto drop-shadow-2xl animate-float"
                  style={bossMaskStyle}
                />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-sm font-bold text-accent uppercase tracking-wide">
                Meet your judge
              </span>
              <h2 className="mt-3 text-4xl font-black text-foreground text-balance">
                He&apos;s heard every excuse in the book.
              </h2>
              <p className="mt-5 text-lg text-muted font-medium leading-relaxed text-balance">
                Marcus has sat through 10,000 pitches. He&apos;s a skeptical
                VC who doesn&apos;t sugarcoat anything. Impress him and
                he&apos;ll tell you. Bore him and he&apos;ll tell you that
                too.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {traits.map((trait) => (
                  <span
                    key={trait}
                    className="text-sm font-semibold text-accent border-2 border-accent rounded-full px-4 py-1.5"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCORE PREVIEW */}
        <section className="w-full bg-white py-24 px-6">
          <h2 className="text-center text-3xl sm:text-4xl font-black text-foreground">
            What your score looks like
          </h2>

          <div className="max-w-xl mx-auto mt-14 rounded-3xl border-2 border-gray-200 shadow-2xl p-8">
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

            <div className="mt-6 bg-surface border-2 border-border border-l-[6px] border-l-accent rounded-2xl px-5 py-4 text-sm text-foreground font-medium">
              You said &ldquo;I think maybe&rdquo; twice in 60 seconds. Pick a
              lane.
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
        <section className="w-full bg-[#eef2ff] py-24 px-6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col"
              >
                <p className="text-sm text-foreground font-medium leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 text-sm font-bold text-accent">
                  {t.author}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full bg-accent py-24 px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white text-balance">
            Ready to face the boss?
          </h2>
          <p className="mt-4 text-lg font-medium text-indigo-200">
            Your first scenario is waiting.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block text-lg font-bold bg-white hover:bg-indigo-50 text-accent px-10 py-4 rounded-full shadow-lg transition-all hover:scale-105"
          >
            Start Training Free
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-gray-900 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo theme="light" />
          <p className="text-sm text-gray-400 font-medium text-center">
            Built with ❤️ for people tired of winging it
          </p>
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} PitchRank
          </p>
        </div>
      </footer>
    </div>
  );
}
