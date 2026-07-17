import Link from "next/link";
import { Logo } from "@/components/Logo";

const steps = [
  {
    number: "01",
    title: "Record",
    description:
      "Every day you get a new scenario and a new listener. Hit record and pitch on the spot — no rehearsal, no do-overs.",
  },
  {
    number: "02",
    title: "Get scored",
    description:
      "An AI boss who's heard every excuse in the book grades your hook, clarity, confidence, and close.",
  },
  {
    number: "03",
    title: "Improve",
    description:
      "Track your streak, unlock harder scenarios, and watch your pitch actually get better — one day at a time.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-6xl mx-auto w-full">
        <Logo />
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
          >
            Start Free
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center px-6">
        <section className="max-w-3xl mx-auto text-center pt-20 pb-24 sm:pt-28 sm:pb-32">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white text-balance">
            Practice pitching.
            <br />
            Every day.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto text-balance">
            A new listener every day. Record your pitch, get brutally honest
            feedback from an AI boss who&apos;s heard it all.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="text-base font-semibold bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded-xl transition-colors"
            >
              Start Free
            </Link>
          </div>
        </section>

        <section className="w-full max-w-5xl mx-auto pb-28">
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-surface border border-border rounded-2xl p-8 text-left"
              >
                <span className="text-accent text-sm font-mono">
                  {step.number}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-muted border-t border-border">
        PitchRank — practice makes pitch.
      </footer>
    </div>
  );
}
