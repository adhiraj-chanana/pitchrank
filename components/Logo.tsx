import Link from "next/link";

export function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="currentColor"
      />
      <path
        d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  theme = "dark",
}: {
  href?: string;
  theme?: "dark" | "light";
}) {
  const isLight = theme === "light";

  return (
    <Link href={href} className="flex items-center gap-2.5 select-none">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent shrink-0">
        <MicIcon className="w-4 h-4 text-white" />
      </span>
      <span
        className={`text-xl font-black tracking-tight ${
          isLight ? "text-white" : "text-foreground"
        }`}
      >
        Pitch
        <span className={isLight ? "text-indigo-300" : "text-accent"}>
          Rank
        </span>
      </span>
    </Link>
  );
}
