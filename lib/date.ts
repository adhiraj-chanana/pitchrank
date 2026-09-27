// Computes "today" as a YYYY-MM-DD string in the given IANA timezone (e.g.
// the browser-reported zone from the `tz` cookie). Falls back to UTC when
// no timezone is given, or when the given one is missing/malformed (a bad
// Intl.DateTimeFormat construction throws, which we treat as "unknown").
export function todayDateString(timeZone?: string): string {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      if (year && month && day) return `${year}-${month}-${day}`;
    } catch {
      // Invalid IANA timezone string — fall through to the UTC default.
    }
  }
  return new Date().toISOString().slice(0, 10);
}

// Calendar-day subtraction on a YYYY-MM-DD string, independent of timezone —
// once a date string is resolved (e.g. via todayDateString), "the day
// before it" is pure calendar arithmetic, not a new timezone lookup.
export function previousDateString(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function relativeDate(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}
