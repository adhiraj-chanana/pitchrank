import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
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

  try {
    const timeZone = await getRequestTimeZone();
    const scenario = await getOrCreateTodayScenario(user.id, undefined, timeZone);
    return NextResponse.json({ scenario });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
