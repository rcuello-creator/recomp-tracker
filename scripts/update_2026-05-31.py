#!/usr/bin/env python3
"""Sesión 2026-05-31: backfill DailyLogs (May 17-30), 2 Starfit scans (May 31),
and Settings refinements (BMR adjustment, day-type targets, week targets,
per-meal carb floors).

Idempotent — re-running it is safe:
- `migrate` ensures activeCal column exists in DailyLogs (no-op if present).
- `saveLog` upserts by date; brief values overwrite OCR partial rows.
- `saveScan` is append-only; we check existing scans before inserting May 31.
- `updateSettings` upserts by key; existing keys are updated, new ones added.

Brief schema is snake_case; Sheet uses camelCase. Mapping is done in this script.

Usage:
    python3 scripts/update_2026-05-31.py            # dry run
    python3 scripts/update_2026-05-31.py --apply    # confirm + write
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

# ----------------------------------------------------------------------------
# Brief data (May 17-30 backfill)
# ----------------------------------------------------------------------------

# Schema mapping (brief → sheet):
#   cal      → calories
#   prot     → protein
#   carbs    → carbs
#   fat      → fat
#   active   → activeCal      (NEW column — added via migrate)
#   bmr      → not stored     (used at runtime, comes from settings.bmr_katch)
#   tdee     → not stored     (calculated)
#   deficit  → not stored     (calculated)
#   lift_ref → appended to notes (no dedicated column)
#   lift     → liftDone (boolean)
BACKFILL = [
    # date,        cal,  prot, carbs, fat,  active, lift_ref, notes
    ("2026-05-17", 2288, 263,  164,   60.5, 1110, "#35", "Baseline + Finish-Line Fri"),
    ("2026-05-18", 2147, 216,  154,   64.7,  908, None,  ""),
    ("2026-05-19", 2261, 253,  157,   71.7,  870, "#36", "Press Pull Rotation"),
    ("2026-05-20", 2577, 277,  198,   72.3, 1035, "#37", "Lower modificado, lumbar restrict"),
    ("2026-05-21", 2229, 222,  139,   82,    413, None,  "Low activity day"),
    ("2026-05-22", 2796, 229,  261,   90,   1159, "#38", "Chest Tri Cardio"),
    ("2026-05-23", 2181, None, None,  None,  459, None,  "Cardio solo"),
    ("2026-05-24", 2677, 268,  199,   84,   1038, "#39", "Pull Bicep Aux Lower wk1 (6,380 lbs vol)"),
    ("2026-05-25", 2705, 151,  280,   110,   843, None,  "SUPERAVIT - cena familiar seafood rice"),
    ("2026-05-26", 2520, 209,  162,   108,   692, None,  "SUPERAVIT - viaje México"),
    ("2026-05-27", 2396, 219,  192,   85,    963, "#40", "Press Shoulder Core wk2 (hotel México)"),
    ("2026-05-28", None, None, None,  None,  None, None, "SIN DATA - regreso de México"),
    ("2026-05-29", 1773, 201,  153,   43,    709, "#41", "Pull Bicep Aux Lower wk2, día clean"),
    ("2026-05-30", 1925, 207,  124.5, 61.2,  622, None,  "Día clean, sin lift"),
]


def daily_log_payload(row: tuple) -> dict:
    """Convert a BACKFILL tuple into the camelCase saveLog payload."""
    date, cal, prot, carbs, fat, active, lift_ref, notes = row
    payload: dict = {"date": date}
    if cal is not None:      payload["calories"] = cal
    if prot is not None:     payload["protein"] = prot
    if carbs is not None:    payload["carbs"] = carbs
    if fat is not None:      payload["fat"] = fat
    if active is not None:   payload["activeCal"] = active
    if lift_ref:
        payload["liftDone"] = True
        # Tag the lift number in notes since there's no dedicated column
        notes = f"Lift {lift_ref} · {notes}".strip(" ·")
    elif cal is not None:  # explicit no-lift day with data
        payload["liftDone"] = False
    if notes:                payload["notes"] = notes
    return payload


# ----------------------------------------------------------------------------
# Two Starfit scans for May 31 (informal + official)
# ----------------------------------------------------------------------------

# Sheet schema: date, weight, bodyFat, leanMass, fatMass, bodyScore, bodyWater,
#               visceralFat, bmr, context, createdAt
# Brief adds: time, skeletal_muscle, is_official → folded into `context` field
# since the sheet schema doesn't have them and PWA doesn't read them.
SCANS_2026_05_31 = [
    {
        "date": "2026-05-31",
        "weight": 222.8,
        "bodyFat": 35.9,
        "fatMass": 80.0,
        "leanMass": 142.8,
        "bodyWater": 104.7,
        "visceralFat": 15,
        "bodyScore": 64,
        "bmr": 1769,
        "context": "06:14 informal · skeletal_muscle 81.5 · before extra sleep",
    },
    {
        "date": "2026-05-31",
        "weight": 222.0,
        "bodyFat": 35.9,
        "fatMass": 79.7,
        "leanMass": 142.3,
        "bodyWater": 104.3,
        "visceralFat": 15,
        "bodyScore": 63,
        "bmr": 1765,
        "context": "08:15 OFFICIAL weekly · skeletal_muscle 81.3 · post additional sleep",
    },
]


# ----------------------------------------------------------------------------
# Settings — bmr/weight adjustments + new day-type targets + week targets
# ----------------------------------------------------------------------------

SETTINGS = {
    # Adjustments confirmed by Scan 31 May
    "bmr_katch": 1765,
    "bmr_source": "Scan oficial 2026-05-31",
    "bmr_adjustment_date": "2026-05-31",
    "weight_current": 222.0,
    "phase1_adjustment_date_v2": "2026-05-31",
    "phase1_adjustment_reason_v2": "Lean mass dropping, refined macros by day type",

    # Day-type targets (Home rings now reads these if present)
    "target_cal_standard": 2200,
    "target_cal_lift": 2400,
    "target_cal_refeed": 2600,
    "target_prot_standard": 200,
    "target_prot_lift": 220,
    "target_carbs_standard": 220,
    "target_carbs_lift": 240,
    "target_carbs_refeed": 280,
    "target_fat_standard": 55,
    "target_fat_refeed": 50,

    # Active cal target per day type (Bug 4 fix)
    "target_active_cal_standard": 500,
    "target_active_cal_lift": 700,
    "target_active_cal_refeed": 400,

    # Week targets (used by Week Progress card)
    "lifts_per_week_target": 4,
    "lifts_per_week_max": 5,
    "steps_no_lift": 10000,
    "steps_lift_day": 7000,

    # Floors / critical thresholds
    "lean_mass_floor": 142.3,

    # Carbs no-negotiables per meal
    "carbs_per_meal_breakfast": 45,
    "carbs_per_meal_lunch": 70,
    "carbs_per_meal_pre_lift": 28,
    "carbs_per_meal_dinner": 50,
    "carbs_per_meal_snack_pm": 18,

    # Note: refeed_day intentionally NOT added — sheet already has
    # `refeed_schedule: "Saturday"` (same semantic, would duplicate).
}


# ----------------------------------------------------------------------------
# .env.local loader (no external dep)
# ----------------------------------------------------------------------------

def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        raise FileNotFoundError(f".env.local not found at {path}")
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


# ----------------------------------------------------------------------------
# Webhook client
# ----------------------------------------------------------------------------

def call(url: str, secret: str, action: str, data) -> dict:
    payload = json.dumps({"secret": secret, "action": action, "data": data}).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "text/plain;charset=utf-8"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {e.read().decode(errors='replace')}")
    if "error" in body:
        raise RuntimeError(f"Apps Script error: {body['error']}")
    return body


def fetch_history(url: str, secret: str) -> dict:
    full_url = f"{url}?secret={secret}"
    with urllib.request.urlopen(full_url, timeout=30) as resp:
        return json.loads(resp.read())


# ----------------------------------------------------------------------------
# Pretty-print helpers
# ----------------------------------------------------------------------------

def print_backfill_diff(existing_dates: set) -> None:
    print("\n=== DailyLogs backfill (saveLog x14) ===")
    print(f"{'date':12} {'cal':>5} {'P':>4} {'C':>5} {'F':>4} {'active':>6}  lift  status")
    for row in BACKFILL:
        date, cal, prot, carbs, fat, active, lift, notes = row
        cal_s   = f"{cal!s:>5}"   if cal   is not None else "    -"
        prot_s  = f"{prot!s:>4}"  if prot  is not None else "   -"
        carbs_s = f"{carbs!s:>5}" if carbs is not None else "    -"
        fat_s   = f"{fat!s:>4}"   if fat   is not None else "   -"
        act_s   = f"{active!s:>6}" if active is not None else "     -"
        lift_s  = lift or "-"
        status  = "OVERWRITE" if date in existing_dates else "INSERT"
        print(f"{date}  {cal_s} {prot_s} {carbs_s} {fat_s} {act_s}  {lift_s:<4}  {status}")


def print_scans_diff(existing_may31_count: int) -> None:
    print(f"\n=== StarfitScans May 31 (saveScan x2) ===")
    if existing_may31_count > 0:
        print(f"  ⚠️  {existing_may31_count} scan(s) already exist for 2026-05-31. Re-running will create duplicates.")
    for s in SCANS_2026_05_31:
        print(f"  {s['date']}  weight={s['weight']}  BF={s['bodyFat']}%  lean={s['leanMass']}  | {s['context'][:60]}")


def print_settings_diff(existing_keys: dict) -> None:
    print(f"\n=== Settings ({len(SETTINGS)} keys) ===")
    longest = max(len(k) for k in SETTINGS)
    for k, v in SETTINGS.items():
        existing = existing_keys.get(k)
        marker = "UPDATE" if existing is not None else "INSERT"
        prev = f"  (was: {existing})" if existing is not None and str(existing) != str(v) else ""
        print(f"  [{marker}] {k.ljust(longest)} = {v}{prev}")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Apply 2026-05-31 session changes.")
    parser.add_argument("--apply", action="store_true", help="Write to the sheet (default: dry run).")
    parser.add_argument("--env", default=str(Path(__file__).resolve().parent.parent / ".env.local"))
    args = parser.parse_args()

    env_path = Path(args.env)
    env = load_env(env_path)
    url = env.get("VITE_API_URL")
    secret = env.get("VITE_API_SECRET")
    if not url or not secret:
        print(f"ERROR: VITE_API_URL or VITE_API_SECRET missing from {env_path}", file=sys.stderr)
        return 2

    print(f"Target: {url}")
    print(f"Mode:   {'APPLY (will write)' if args.apply else 'DRY RUN (no writes)'}")

    # Read current state so dry-run can show what's INSERT vs OVERWRITE/UPDATE
    print("\nFetching current Sheet state...")
    try:
        history = fetch_history(url, secret)
    except Exception as e:
        print(f"WARNING: could not fetch history ({e}). Diff will not show INSERT vs UPDATE markers.")
        history = {}

    existing_log_dates = {l.get("date", "") for l in history.get("logs", [])}
    existing_settings = history.get("settings", {})
    existing_may31_scans = sum(1 for s in history.get("scans", []) if s.get("date") == "2026-05-31")

    print_backfill_diff(existing_log_dates)
    print_scans_diff(existing_may31_scans)
    print_settings_diff(existing_settings)

    if not args.apply:
        print("\n--- Dry run complete. Re-run with --apply to write. ---")
        return 0

    confirm = input("\nWrite all of the above to the sheet? [yes/N] ").strip().lower()
    if confirm not in {"yes", "y"}:
        print("Aborted.")
        return 1

    # Step 1: Migration — ensure activeCal column exists in DailyLogs
    print("\n[1/4] Migrating schema (ensure activeCal column)...")
    try:
        resp = call(url, secret, "migrate", {"tabs": {"DailyLogs": ["activeCal"]}})
        print(f"   {resp.get('summary')}")
    except RuntimeError as e:
        print(f"   FAILED: {e}", file=sys.stderr)
        return 3

    # Step 2: Backfill DailyLogs
    print(f"\n[2/4] Backfilling {len(BACKFILL)} daily logs...")
    for row in BACKFILL:
        payload = daily_log_payload(row)
        try:
            resp = call(url, secret, "saveLog", payload)
            print(f"   {row[0]}  {resp.get('action', 'ok')}")
        except RuntimeError as e:
            print(f"   {row[0]}  FAILED: {e}", file=sys.stderr)
            return 3

    # Step 3: Starfit scans
    print(f"\n[3/4] Inserting {len(SCANS_2026_05_31)} Starfit scans for 2026-05-31...")
    if existing_may31_scans > 0:
        skip = input(f"   {existing_may31_scans} scan(s) already exist for 2026-05-31. Skip insert? [yes/N] ").strip().lower()
        if skip in {"yes", "y"}:
            print("   skipped (existing scans preserved)")
        else:
            for s in SCANS_2026_05_31:
                try:
                    call(url, secret, "saveScan", s)
                    print(f"   {s['date']}  weight={s['weight']}  added")
                except RuntimeError as e:
                    print(f"   FAILED: {e}", file=sys.stderr)
                    return 3
    else:
        for s in SCANS_2026_05_31:
            try:
                call(url, secret, "saveScan", s)
                print(f"   {s['date']}  weight={s['weight']}  added")
            except RuntimeError as e:
                print(f"   FAILED: {e}", file=sys.stderr)
                return 3

    # Step 4: Settings
    print(f"\n[4/4] Updating {len(SETTINGS)} settings keys...")
    try:
        resp = call(url, secret, "updateSettings", SETTINGS)
        updated = resp.get("updated", [])
        print(f"   {len(updated)} keys upserted")
    except RuntimeError as e:
        print(f"   FAILED: {e}", file=sys.stderr)
        return 3

    # Step 5: Cleanup empty Lifts rows (OCR residue)
    print("\n[5/5] Cleaning empty Lifts rows (session='' AND volume='')...")
    try:
        resp = call(url, secret, "cleanupEmptyLifts", None)
        deleted = resp.get("deleted", 0)
        print(f"   {deleted} empty lifts row(s) removed")
    except RuntimeError as e:
        print(f"   FAILED (non-fatal, can clean manually): {e}", file=sys.stderr)

    print("\nDone. Verify in the Sheet:")
    print("  - DailyLogs: 14 rows May 17-30, with activeCal column populated")
    print("  - StarfitScans: 2 new rows for May 31")
    print("  - Settings: bmr_katch=1765, weight_current=222.0, +new day-type/week keys")
    print("  - Lifts: empty (no session, no volume) rows removed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
