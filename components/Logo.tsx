import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 select-none">
      <span className="text-xl font-bold tracking-tight text-white">
        Pitch<span className="text-accent">Rank</span>
      </span>
    </Link>
  );
}
