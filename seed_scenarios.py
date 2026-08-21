"""Seed the Supabase `scenarios` table from scenarios.csv.

Usage:
    pip install supabase python-dotenv
    python seed_scenarios.py
"""

import csv
import sys

from dotenv import load_dotenv
import os

from supabase import create_client

CSV_PATH = "scenarios.csv"
REQUIRED_COLUMNS = ["title", "context", "prompt", "tier", "category"]
VALID_TIERS = {"beginner", "intermediate", "advanced", "expert"}


def load_rows(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            print(f"scenarios.csv is missing required columns: {missing}")
            sys.exit(1)
        return list(reader)


def main() -> None:
    load_dotenv(".env.local")

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)

    try:
        rows = load_rows(CSV_PATH)
    except FileNotFoundError:
        print(f"Could not find {CSV_PATH} in the current directory.")
        sys.exit(1)

    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    client = create_client(url, key)

    # Category slug -> id, looked up at runtime rather than hardcoded (unlike
    # VALID_TIERS above) so adding a new category is just a DB insert, not a
    # code change here.
    categories_resp = client.table("categories").select("id, slug").execute()
    category_by_slug = {row["slug"]: row["id"] for row in categories_resp.data}
    if not category_by_slug:
        print(
            "No rows in the categories table. Run the categories migration "
            "(supabase/migrations/001_add_categories_step_a.sql) first."
        )
        sys.exit(1)

    zero_uuid = "00000000-0000-0000-0000-000000000000"

    # pitch_attempts and daily_scenarios both have a foreign key to
    # scenarios(id) with no cascade, so they must be cleared first.
    print("Deleting existing rows from pitch_attempts...")
    try:
        client.table("pitch_attempts").delete().neq("id", zero_uuid).execute()
    except Exception as e:
        print(f"Failed to delete pitch_attempts: {e}")
        sys.exit(1)

    print("Deleting existing rows from daily_scenarios...")
    try:
        client.table("daily_scenarios").delete().neq("date", "1970-01-01").execute()
    except Exception as e:
        print(f"Failed to delete daily_scenarios: {e}")
        sys.exit(1)

    print("Deleting existing rows from scenarios...")
    try:
        client.table("scenarios").delete().neq("id", zero_uuid).execute()
    except Exception as e:
        print(f"Failed to delete existing rows: {e}")
        sys.exit(1)
    print("Existing rows deleted.")

    inserted = 0
    failed = 0
    for i, row in enumerate(rows, start=1):
        tier = (row.get("tier") or "").strip()
        if tier not in VALID_TIERS:
            print(f"[{i}/{len(rows)}] Skipping row with invalid tier {tier!r}: {row.get('title')!r}")
            failed += 1
            continue

        category_slug = (row.get("category") or "").strip()
        category_id = category_by_slug.get(category_slug)
        if category_id is None:
            print(
                f"[{i}/{len(rows)}] Skipping row with unknown category {category_slug!r}: {row.get('title')!r}"
            )
            failed += 1
            continue

        payload = {
            "title": (row.get("title") or "").strip(),
            "context": (row.get("context") or "").strip(),
            "prompt": (row.get("prompt") or "").strip(),
            "tier": tier,
            "category_id": category_id,
        }

        try:
            client.table("scenarios").insert(payload).execute()
            inserted += 1
            print(f"[{i}/{len(rows)}] Inserted: {payload['title']}")
        except Exception as e:
            failed += 1
            print(f"[{i}/{len(rows)}] Failed to insert {payload['title']!r}: {e}")

    print(f"\nDone. Inserted {inserted}/{len(rows)} rows ({failed} failed).")


if __name__ == "__main__":
    main()
