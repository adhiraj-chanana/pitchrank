# Design pass — Stage 1 baseline

Scope: `npx impeccable detect` static scan + manual critique across the four
key flows (landing/onboarding, practice/recording, results/scoring,
dashboard/streak). `impeccable`'s skill-bundle commands (`/critique`,
`/onboard`, `/harden`, `/clarify`) are unavailable this session — the
upstream GitHub release the installer needs (`v4.1.0`) 404s
(pbakaus/impeccable#479) — so this is `detect` plus my own manual read of
every screen, each finding labeled `[detect]` or `[manual]`.

## Raw `detect` output

```
npx impeccable detect app components

app/feedback/page.tsx
  line 167: [side-tab] border-l-4
  line 186: [side-tab] border-l-4

app/results/ResultsReveal.tsx (imported by page.tsx)
  line 174: [side-tab] border-l-4
  line 193: [side-tab] border-l-4

4 anti-patterns found.
```

## Prioritized issues (top of list = fix first)

1. **[detect] `border-l-4` side-tab cards on the results screen**
   `app/results/ResultsReveal.tsx:174,193` and `app/feedback/page.tsx:167,186`.
   Every "What the boss noticed" / "What worked" feedback point is a
   thick-colored-left-border card — impeccable's own description calls
   this "the most recognizable tell of AI-generated UIs." This shows up on
   the emotional payoff screen (results reveal) and its history equivalent
   (feedback), so it's high-visibility.

2. **[manual] Results reveal is a wall of identical stat boxes**
   `ResultsReveal.tsx:117-140` renders all six score dimensions (Hook,
   Clarity, Confidence, Close, Filler, Pace) as the same
   `bg-surface rounded-xl shadow-sm p-4` box in a uniform grid, and the
   filler-words / WPM stats just below repeat the pattern again in
   `border-2 rounded-2xl` boxes. This is the moment the product should feel
   most rewarding and distinct — right now it reads like a generated
   analytics dashboard, not a verdict from a specific, opinionated boss.

3. **[manual] Landing page never got the "remove AI tells" pass**
   `app/page.tsx` is still built almost entirely from repeated
   `rounded-2xl`/`rounded-3xl` cards, centered text/sections, and pill
   badges (traits, tier milestones, testimonials, the score-preview mock).
   The dashboard and typography got the treatment; the landing page — the
   first thing a prospect sees — didn't, so it's the part of the app most
   likely to still read "generic template" to a new visitor.

4. **[manual] Login/signup are the most generic screens in the app**
   `app/login/page.tsx` (and signup, same shape) is a dead-centered
   `rounded-3xl` card with bordered `rounded-2xl` inputs on an empty page —
   textbook centered-auth-card template. No boss, no personality, no
   voice — a jarring drop after the branded landing page, and it's the
   very next screen after someone clicks "Start Training Free."

5. **[manual] Emoji-as-icon still present at the biggest reward moment**
   `components/StreakCelebration.tsx:115` renders the milestone icon as a
   raw `text-7xl` emoji (🔥/⚡/👑). This is the single highest-stakes
   celebration moment in the product (streak milestone unlock) and it's
   currently a bare emoji glyph rather than a designed icon/mark, same
   category as the flame-icon fix already done on the dashboard.

6. **[manual] Repeated `bg-accent rounded-2xl/3xl` "hero card" shape**
   The same accent-filled rounded card shows up as the old dashboard
   mission card (now fixed), the results-reveal bottom CTA
   (`ResultsReveal.tsx:228`), and the score-preview mock on the landing
   page — same silhouette, different copy, each time it appears. Worth
   varying at least one of these so the accent-block doesn't become its
   own repeated template tell.

7. **[manual] Mood emoji used as inline flavor text**
   `{mood.emoji}` is rendered directly next to copy in
   `app/dashboard/page.tsx:150`, `app/results/ResultsReveal.tsx:68`, and
   `app/feedback/page.tsx:92`. Lower priority than #5 — this reads more as
   "Marcus's mood today" flavor text than an icon standing in for UI, but
   it's the same emoji-as-visual-element pattern the brief called out and
   is worth a second look once the higher-priority items are settled.

Items 1, 2, and 5 sit on flows the guardrails explicitly protect from
logic changes (scoring, streak) — all three are pure markup/class fixes,
nothing about how a score or streak is computed changes.

## Not flagged

- The practice/recording flow (`app/pitch/PitchClient.tsx`) is already the
  most distinct screen in the app (big circular mic button, live waveform,
  countdown) — no findings here.
- The dashboard, now on the B+C merged layout, and the accent/typography
  swap are excluded since they were just implemented in this same session.

## Functional UX / day-2 retention risks

Requested separately from the visual findings above: things that could
stop a first-time user from coming back tomorrow, not just things that
look generic.

1. **[manual] The daily boundary is UTC, not the user's local time, and
   this is never surfaced anywhere.** `todayDateString()`
   (`lib/date.ts:1-3`) is `new Date().toISOString().slice(0, 10)` — the
   day rolls over at UTC midnight. For a US user that's 5-8pm local, not
   midnight. Someone who pitches at 9pm Pacific could find the "day" has
   already advanced server-side — their streak silently breaks, or what
   they think is today's attempt actually lands on a different date than
   they expect — with no message anywhere explaining why. Silent,
   unexplained streak breaks are one of the most common reasons habit
   apps lose people right after day 1.

2. **[manual] No app-wide error boundary — a first-time failure shows
   Next.js's bare default error page, not the product.** There's no
   `error.tsx` anywhere in `app/`. `getOrCreateTodayScenario` (called on
   every dashboard and pitch-page load) throws if no scenario row exists
   for a tier/category (`lib/today-scenario.ts:30-34`) or if the insert
   fails. A brand-new user's very first dashboard load has no fallback
   if that throws — worst-case first impression, and nothing tells them
   what happened or gives them a way back in.

3. **[manual] Resubmitting a completed day fails silently.** If
   `/api/submit-pitch` returns 409 (already submitted today — double
   click, duplicate tab, or coming back to a stale `/pitch` tab),
   `PitchClient.tsx:362-365` just redirects to `/dashboard` with no
   message. It looks like the pitch vanished rather than "you already
   did this today," right after someone just finished a 60-second
   recording.

4. **[manual] The core mechanic (one pitch a day, streak resets on a
   missed day) is explained on the marketing page but never inside the
   signed-in app.** Landing-page copy states the rule, but nothing on
   `/dashboard` or `/pitch` does, and "come back tomorrow" never says
   when tomorrow starts. A new user has to infer the rules from the
   marketing copy they read once, days before it matters.
