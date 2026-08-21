import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

// The only category today. Every existing call site relies on this default
// so adding new categories later doesn't require touching them.
export const DEFAULT_CATEGORY_SLUG = "elevator-pitch";

export async function getCategoryBySlug(slug: string): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Category "${slug}" not found`);
  }

  return data as Category;
}
