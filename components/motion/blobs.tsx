// Organic blob shapes in the spirit of Haikei's blob generator — smooth
// closed splines fit around jittered points on a circle, precomputed so
// every page render draws identical shapes (no per-render randomness).
export const BLOB_PATHS = [
  "M199.6,100.0 C197.9,125.9 189.2,158.8 172.6,172.6 C156.0,186.4 122.6,184.7 100.0,183.1 C77.4,181.4 53.5,176.6 37.3,162.7 C21.0,148.9 3.9,122.3 2.5,100.0 C1.1,77.7 12.8,42.7 29.1,29.1 C45.3,15.5 74.4,20.5 100.0,18.5 C125.6,16.6 165.9,3.9 182.5,17.5 C199.1,31.1 201.2,74.1 199.6,100.0Z",
  "M183.6,100.0 C185.0,126.7 198.2,165.1 184.3,184.3 C170.3,203.4 126.8,216.4 100.0,215.1 C73.2,213.8 40.8,195.6 23.6,176.4 C6.3,157.3 -4.5,124.6 -3.7,100.0 C-2.8,75.4 11.4,45.7 28.7,28.7 C46.0,11.7 75.4,-1.1 100.0,-1.9 C124.6,-2.7 162.2,6.9 176.1,23.9 C190.0,40.9 182.3,73.3 183.6,100.0Z",
  "M215.2,100.0 C219.3,124.5 204.9,171.5 185.7,185.7 C166.5,199.9 126.4,187.4 100.0,185.2 C73.6,183.0 45.1,186.6 27.6,172.4 C10.1,158.2 -4.6,124.7 -5.1,100.0 C-5.6,75.3 6.9,37.9 24.4,24.4 C41.9,10.9 77.2,16.6 100.0,19.1 C122.8,21.5 141.9,25.4 161.1,38.9 C180.3,52.4 211.1,75.5 215.2,100.0Z",
  "M202.8,100.0 C199.3,122.2 173.2,139.5 156.0,156.0 C138.9,172.6 120.7,197.2 100.0,199.3 C79.3,201.3 49.4,184.9 31.6,168.4 C13.9,151.8 -4.6,124.7 -6.5,100.0 C-8.4,75.3 2.3,37.4 20.1,20.1 C37.8,2.7 73.8,-4.4 100.0,-4.0 C126.2,-3.5 160.1,5.4 177.3,22.7 C194.4,40.1 206.3,77.8 202.8,100.0Z",
] as const;

export function Blob({
  path = 0,
  className = "",
  style,
}: {
  path?: 0 | 1 | 2 | 3;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="-20 -20 240 240"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={BLOB_PATHS[path]} fill="currentColor" />
    </svg>
  );
}

/**
 * A layered field of soft, blurred, slowly-drifting blobs used as an
 * ambient section backdrop (Haikei-style organic mesh). Purely decorative
 * — always non-interactive and behind content.
 */
export function BlobField({ className = "" }: { className?: string }) {
  const palette = ["text-accent/40", "text-spark/25", "text-[#8B7CF6]/30"];

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <Blob
        path={0}
        className={`absolute -top-32 -left-24 w-[32rem] h-[32rem] blur-3xl animate-blob-drift ${palette[0]}`}
      />
      <Blob
        path={2}
        className={`absolute top-1/3 -right-32 w-[28rem] h-[28rem] blur-3xl animate-blob-drift ${palette[1]}`}
        style={{ animationDelay: "-5s" }}
      />
      <Blob
        path={1}
        className={`absolute -bottom-40 left-1/4 w-[26rem] h-[26rem] blur-3xl animate-blob-drift ${palette[2]}`}
        style={{ animationDelay: "-10s" }}
      />
    </div>
  );
}
