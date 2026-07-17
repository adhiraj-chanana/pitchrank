import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import { PitchClient } from "./PitchClient";

export default async function PitchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: todayAttempt } = await supabase
    .from("pitch_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", todayDateString())
    .maybeSingle();

  if (todayAttempt) {
    redirect("/dashboard");
  }

  const scenario = await getOrCreateTodayScenario(user.id);

  return <PitchClient scenario={scenario} />;
}
