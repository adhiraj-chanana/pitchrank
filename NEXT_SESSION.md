# PitchRank design pass — session handoff

Branch: `design-pass` (27 commits ahead of `main`, clean working tree,
pushed to `origin/design-pass`). Read this first, then
`git log --oneline main..design-pass` for the full list if needed.

## What's done

**Theme & typography** — warm charcoal background, burgundy accent
(swapped from an initial tomato red per feedback), mustard highlight,
Bricolage Grotesque headlines. Fully token-based in `tailwind.config.ts`
(`background`, `surface`, `border`, `foreground`, `muted`, `accent`,
`highlight`, `success`, `warning`, `danger`) — no hardcoded hex in
components except the documented `GradientWaves` exception in
`components/PageBackground.tsx`.

**Dashboard** — rebuilt via a 3-way prototype comparison (dev-only route,
since deleted) into a merged "streak rail + editorial scenario" layout:
tier-marker progress rail, boss floated next to the scenario, ruled
dividers instead of boxed cards.

**Stage 1 baseline** (`design-pass-baseline.md`) — `impeccable detect`
scan plus manual critique across all 4 key flows, and 4 functional/
retention findings (day-2 churn risks). Kept as the design record; still
accurate as of this session.

**Approved visual fixes 1–6** (all shipped, see baseline doc for what
each number means): border-l-4 "side-tab" cards removed, results reveal
redesigned as a verdict instead of a stat-box grid, landing page pill/
card uniformity lightened, login/signup given boss presence, milestone
emoji replaced with inline SVG icons, repeated accent-block shape varied.

**Manual Stage 2 passes** (impeccable's slash-commands are blocked
upstream, see Open issues — these were done by hand, explicitly labeled
as manual, not claimed as `/impeccable` output):
- Onboard: dashboard states the one-pitch-a-day/streak-reset rule.
- Harden: added `app/error.tsx` global error boundary; duplicate
  submission (409) now shows a message instead of silently redirecting.
- Clarify: (superseded — see timezone fix below, which fixed the root
  cause instead of just disclosing it; the caveat copy was removed).

**Timezone fix** — `todayDateString(timeZone?)` in `lib/date.ts` now
computes "today" in the user's local IANA timezone via
`Intl.DateTimeFormat`, validated by construction (bad/missing zone falls
back to UTC). `components/TimezoneSync.tsx` reports the browser's zone
via a `tz` cookie, read server-side through `lib/timezone.ts`. Threaded
through every "today" call site: dashboard, pitch, and results pages,
`today-scenario`/`check-attempt`/`submit-pitch` API routes, and
`getOrCreateTodayScenario`. Also fixed `submit-pitch`'s "yesterday"
check, which used to compute yesterday from raw UTC arithmetic
independent of the (now tz-aware) today — replaced with
`previousDateString`, pure calendar subtraction on the resolved date
string.

**First-run experience** — all gated on a server-side count of
`pitch_attempts` (never localStorage): a Marcus welcome banner on the
dashboard for zero-attempt users, a dismissible "what to expect" note
before a first-ever recording, a boss-presence empty state on History
(matching Feedback's existing one), and a "Day 1 done" line on the
results reveal for a user's first-ever completed attempt.

**Stage 3 mobile pass** — `min-h-screen`/`h-screen` now compile to
`100dvh` (mobile toolbar-safe); `viewport-fit=cover` plus new
`.pt-safe`/`.pb-safe` utilities applied to the landing Navbar and the
StreakCelebration modal; `hover:` redefined globally to
`@media (hover: hover) and (pointer: fine)` so touch taps no longer
stick in a hovered state; tap-highlight and 300ms-tap-delay removed
globally; all login/signup inputs are `text-base` (16px, the iOS
zoom-on-focus threshold); both hamburger buttons are 44px targets;
BossReaction's hover flourish now checks `pointerType === "mouse"` so a
tap can't trigger and strand it.

**Motion (this session)** — Step 1: Apple-style scroll motion on the
landing page only. `components/motion/ScrollReveal.tsx`
(IntersectionObserver) fades+slides every section below the hero in on
scroll, staggers "How it works" steps and testimonials via CSS
transition-delay, and a CSS-only `@supports (animation-timeline: view())`
scroll-driven parallax runs on the hero boss image — all progressively
enhance server-rendered markup that has no hiding classes at all, so the
page is fully visible with JS disabled, and everything is wrapped in
`@media (prefers-reduced-motion: no-preference)`.

Step 2, all 5 approved animations shipped:
- **#1+#3** (sequenced together): `components/BossReaction.tsx` now
  fires `onSequenceComplete` after its pulse/shake finishes instead of
  at the same instant, so the results reveal goes dialogue → boss pulse
  → score count-up (`components/motion/AnimatedNumber.tsx`) → breakdown
  bars filling in a staggered sequence (`ScoreBar`'s new `start`/
  `delayMs` props). ~2.7s total, under the ~3s budget.
- **#2+#5** (paired as one moment): `components/dashboard/StreakMoment.tsx`
  plays the streak digit counting up alongside a Sonner toast ("Day N
  streak saved"), triggered by a `?justCompleted=1` param the results
  page's "Back to Dashboard" link sets, stripped via
  `history.replaceState` after firing. Added `sonner` as a dependency;
  `<Toaster>` lives in `app/layout.tsx`, styled via Tailwind
  `toastOptions.classNames` (no hardcoded hex), documented as a
  third-party-animation exception like `GradientWaves`.
- **#4a**: `StreakCelebration`'s milestone modal (7/14/30, thresholds
  unchanged) now stages its reveal — icon, title block, boss+quote pop
  in ~120ms apart — and confetti is a single front-loaded burst instead
  of an infinite falling loop, skipped entirely under reduced motion.
- **#4b**: a lighter Day-3 moment, display-only — `StreakMoment` swaps
  in a Day-3-specific toast description (a short boss line) instead of
  a separate ceremony. Pure branch on the already-computed streak value,
  no schema/type/tier changes.

All motion rules honored throughout: transform/opacity only (except the
JS-driven number count-up, which is text content, not CSS motion),
`prefers-reduced-motion` fallback via CSS guards (`.animate-boss-react`/
`.animate-grow-bar` in `globals.css`, `!important` to sidestep any
Tailwind-utility-vs-custom-layer ordering ambiguity) plus JS checks
where inline styles can't be media-queried (confetti), `hover:` already
globally scoped to `(hover: hover) and (pointer: fine)` from Stage 3, no
hydration mismatches (every conditional initial-render value is either a
plain `useState` constant or server-derived, never `Date.now()`/random).

## Open issues

- **Upstream blocker, unresolved:** `impeccable`'s skill-bundle installer
  404s on GitHub release `v4.1.0` (pbakaus/impeccable#479) — confirmed
  real, not local. `/critique`, `/onboard`, `/harden`, `/clarify`
  slash-commands are unavailable; everything labeled "manual" in this
  branch was done by hand instead. Re-check if it's worth revisiting.
- **Timezone migration edge case:** for roughly the first 24 hours after
  this ships, a user whose local date differs from UTC's current date
  could see a one-time streak inconsistency (a stored UTC-dated
  `last_completed_date` not matching the new local-time "yesterday").
  Self-corrects after one full local day cycle; no historical data was
  rewritten or lost.
- `dickwu/apple-design-skill` was never installed (deferred to the user).
- Not yet re-run: `npx impeccable detect app components` since the
  Stage 1 baseline — worth a fresh pass before the next visual stage to
  confirm no new anti-patterns crept in.
- **Pre-existing reduced-motion gap, not fixed this session:** several
  ambient animations predate this session and were left as-is since they
  weren't part of the 5 approved motion items —
  `animate-float`/`animate-boss-float`/`animate-bubble-pulse`/
  `animate-glow-pulse` (globals.css) run regardless of
  `prefers-reduced-motion`. Only `.animate-boss-react` and
  `.animate-grow-bar` were brought into compliance, since the new
  results-reveal sequencing depends on them directly. Worth a full
  motion-audit pass, likely as part of Stage 6 or 7.

## Next steps (not started)

- **Stage 6: AI UX review** — a fresh AI-assisted review pass now that
  theme, dashboard, fixes 1–6, first-run, mobile, and motion are all in,
  likely re-running `impeccable detect` plus another manual critique
  round given how much has changed since the Stage 1 baseline.
- **Stage 7: verify** — final end-to-end verification pass (build, lint,
  route smoke test, and likely a real mobile-device check given how much
  of Stage 3/motion is only verifiable by eye on an actual notched
  device — scroll parallax, safe areas, the sequenced results reveal
  timing, toast placement).

Guardrails still in effect throughout: no changes to categories,
scoring, or streak *computation* logic (the timezone fix changed how
"today" is computed, not the streak math itself); no em dashes in UI
copy; commit after each step with a build in between.
