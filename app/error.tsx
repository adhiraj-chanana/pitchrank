"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { PageBackground } from "@/components/PageBackground";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageBackground contentClassName="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Image
        src="/boss/boss-dismissive.png"
        alt="Marcus"
        width={72}
        height={72}
        className="w-[72px] h-[72px] rounded-full object-cover border-2 border-border"
      />
      <h1 className="font-display mt-5 text-2xl font-bold text-foreground">
        Something broke on our end.
      </h1>
      <p className="mt-2 text-sm text-muted font-medium max-w-sm">
        Not your pitch. A technical error, on our side. Try again, or head
        back to your dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-accent hover:bg-accent-hover text-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="text-muted hover:text-foreground font-bold px-6 py-3 rounded-full transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </PageBackground>
  );
}
