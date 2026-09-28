import GradientWaves from "@/components/GradientWaves";

/**
 * Shared animated page background (GradientWaves, fixed to the viewport)
 * used across every page for a consistent look. Sections/cards render in
 * the z-10 content layer above it — solid or translucent, their choice.
 */
export function PageBackground({
  children,
  contentClassName = "",
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {/* GradientWaves takes literal hex color props, not Tailwind classes,
            so these mirror the background/accent/highlight tokens by hand. */}
        <GradientWaves
          horizonColor="#16130F"
          waveColor="#9C2B3C"
          crestColor="#E3B23C"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}
