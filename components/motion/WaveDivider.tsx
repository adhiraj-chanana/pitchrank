/**
 * Haikei-style wavy section divider. Sits at the top edge of a section and
 * paints an organic curve in `fill` so the section above appears to flow
 * into the one below instead of cutting on a hard rectangle.
 */
const WAVE_D =
  "M0,64 C240,110 480,10 720,32 C960,54 1200,112 1440,64 L1440,0 L0,0 Z";

export function WaveDivider({
  fill,
  flip = false,
  className = "",
}: {
  fill: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`absolute left-0 right-0 -top-px w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        className="w-full h-[60px] sm:h-[100px]"
        preserveAspectRatio="none"
      >
        <path d={WAVE_D} fill={fill} />
      </svg>
    </div>
  );
}
