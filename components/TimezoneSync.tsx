"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const COOKIE_NAME = "tz";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

// Reports the browser's IANA timezone to the server via a cookie, so
// server components and API routes can compute "today" in the user's
// local time instead of UTC. Refreshes once on first write per session so
// the current page picks up the corrected date without a full reload.
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    let timeZone: string;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!timeZone || readCookie(COOKIE_NAME) === timeZone) return;

    document.cookie = `${COOKIE_NAME}=${timeZone}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.refresh();
  }, [router]);

  return null;
}
