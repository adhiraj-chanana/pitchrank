import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date";
import { getRequestTimeZone } from "@/lib/timezone";

// See app/dashboard/page.tsx — Supabase's fetch calls can otherwise be
// served stale by Next's default fetch cache even in a dynamic route.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeZone = await getRequestTimeZone();
  const { data: attempt } = await supabase
    .from("pitch_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayDateString(timeZone))
    .maybeSingle();

  return NextResponse.json({
    completed: !!attempt,
    attempt: attempt ?? null,
  });
}
