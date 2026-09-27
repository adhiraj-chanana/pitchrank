import { cookies } from "next/headers";

export const TIMEZONE_COOKIE = "tz";

// The client-reported IANA timezone, set by <TimezoneSync/> on mount.
// Missing or malformed values are left to todayDateString's own UTC
// fallback — this just passes through whatever the cookie holds.
export async function getRequestTimeZone(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TIMEZONE_COOKIE)?.value;
}
