// One-off, read-only check: finds any (user_id, date) pairs in
// pitch_attempts with more than one row — these would violate the new
// unique index this branch is about to add, and must be resolved before
// that migration runs. Never writes anything.
//
// Run: npx tsx scripts/find-duplicate-attempts.ts

import "./_load-env";

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("pitch_attempts")
    .select("id, user_id, date, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data) {
    console.log("No rows returned.");
    return;
  }

  console.log(`Total pitch_attempts rows: ${data.length}`);

  const groups = new Map<string, { id: string; created_at: string }[]>();
  for (const row of data) {
    const key = `${row.user_id}|${row.date}`;
    const list = groups.get(key) ?? [];
    list.push({ id: row.id, created_at: row.created_at });
    groups.set(key, list);
  }

  const duplicates = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);

  if (duplicates.length === 0) {
    console.log("No duplicate (user_id, date) pairs found. Safe to add the unique index.");
    return;
  }

  console.log(`Found ${duplicates.length} duplicate (user_id, date) pair(s):\n`);
  for (const [key, rows] of duplicates) {
    const [userId, date] = key.split("|");
    console.log(`user_id=${userId} date=${date} (${rows.length} rows):`);
    for (const r of rows) {
      console.log(`  id=${r.id} created_at=${r.created_at}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
