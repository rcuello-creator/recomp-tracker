#!/usr/bin/env python3
"""Apply 2026-05-29 Phase 1 adjustment to the Google Sheet.

Reads credentials from `../.env.local` (VITE_API_URL + VITE_API_SECRET) and
posts to the Apps Script Web App.

- `upsertPhase` (one per phase) updates the Phases tab.
- `updateSettings` (one batched call) upserts every key in the Settings tab.

Dry-run by default — prints the payload it WOULD send. Pass --apply to actually
write to the sheet. Requires interactive confirmation before writing.

Usage:
    python scripts/update_phase1.py            # dry run, shows planned changes
    python scripts/update_phase1.py --apply    # confirm + write
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import urllib.request
import urllib.error


# ----------------------------------------------------------------------------
# Configuration — payloads
# ----------------------------------------------------------------------------

PHASES = [
    {
        "id": 1,
        "name": "Reset",
        "startDate": "2026-05-18",
        "endDate": "2026-06-14",
        "calories": 2200,
        "protein": 200,
        "carbs": 220,
        "fat": 55,
        "refeedCal": 2600,
        "description": "Adjusted 2026-05-29 - BMR correction (1818 to 1770)",
    },
    {
        "id": 2,
        "name": "Cut Sostenido",
        "startDate": "2026-06-15",
        "endDate": "2026-07-31",
        "calories": 2100,
        "protein": 210,
        "carbs": 200,
        "fat": 50,
        "refeedCal": 2500,
        "description": "Cascade adjustment 2026-05-29",
    },
    {
        "id": 3,
        "name": "Carb Cycling",
        "startDate": "2026-08-01",
        "endDate": "2026-10-31",
        "calories": 2130,
        "protein": 200,
        "carbs": 200,
        "fat": 50,
        "refeedCal": 2500,
        "description": "Cascade adjustment 2026-05-29",
    },
    {
        "id": 4,
        "name": "Final Cut",
        "startDate": "2026-11-01",
        "endDate": "2027-02-28",
        "calories": 1950,
        "protein": 220,
        "carbs": 170,
        "fat": 45,
        "refeedCal": 2350,
        "description": "Cascade adjustment 2026-05-29",
    },
    {
        "id": 5,
        "name": "Lean Phase",
        "startDate": "2027-03-01",
        "endDate": "2027-08-31",
        "calories": 1850,
        "protein": 220,
        "carbs": 150,
        "fat": 45,
        "refeedCal": 2250,
        "description": "Cascade adjustment 2026-05-29",
    },
]

SETTINGS = {
    "bmr_katch": 1770,
    "bmr_source": "Starfit avg May 25-29 (1763-1780)",
    "bmr_previous": 1818,
    "bmr_adjustment_date": "2026-05-29",
    "tdee_sedentary": 2070,
    "tdee_active_target_low": 2400,
    "tdee_active_target_high": 2700,
    "deficit_target_daily_low": 500,
    "deficit_target_daily_high": 700,
    "weight_baseline_phase1": 223.4,
    "weight_current": 223.8,
    "weight_target_phase1_end": 218,
    "weight_target_phase1_end_low": 217,
    "weight_target_phase1_end_high": 219,
    "bf_baseline_phase1": 35.9,
    "bf_target_phase1_end_low": 33,
    "bf_target_phase1_end_high": 34,
    "phase1_adjustment_date": "2026-05-30",
    "phase1_adjustment_reason": "BMR correction + plateau 13 days",
    "coaching_mode": "auto-regulated",
    "coaching_mode_since": "2026-05-24",
    # 15-month program totals (used by Home rings + Programa progress card)
    "program_start_date": "2026-05-18",
    "program_end_date": "2027-08-31",
    "program_total_days": 471,
    "program_weight_initial": 223.4,
    "program_weight_target": 180,
    "program_total_lbs_to_lose": 43.4,
    "program_total_deficit_target": 151900,
    # Day-type detection for Home rings (LIFT/REFEED/NO_LIFT)
    "refeed_schedule": "Saturday",
}


# ----------------------------------------------------------------------------
# .env.local loader (no external dep — keeps this script standalone)
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
# Apps Script client
# ----------------------------------------------------------------------------


def call_webhook(url: str, secret: str, action: str, data: dict | list) -> dict:
    payload = json.dumps({"secret": secret, "action": action, "data": data}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "text/plain;charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {e.read().decode(errors='replace')}")
    if "error" in body:
        raise RuntimeError(f"Apps Script error: {body['error']}")
    return body


# ----------------------------------------------------------------------------
# Output helpers
# ----------------------------------------------------------------------------


def print_phase_diff() -> None:
    print("\n=== Phases tab (upsertPhase x5) ===")
    print(f"{'id':>2}  {'name':<14}  {'cal':>5}  {'P':>4}  {'C':>4}  {'F':>4}  {'refeed':>6}")
    for p in PHASES:
        print(
            f"{p['id']:>2}  {p['name']:<14}  {p['calories']:>5}  "
            f"{p['protein']:>4}  {p['carbs']:>4}  {p['fat']:>4}  {p['refeedCal']:>6}"
        )


def print_settings_diff() -> None:
    print("\n=== Settings tab (updateSettings batch) ===")
    longest = max(len(k) for k in SETTINGS)
    for k, v in SETTINGS.items():
        print(f"  {k.ljust(longest)} = {v}")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply Phase 1 adjustment to the Sheet.")
    parser.add_argument(
        "--apply", action="store_true",
        help="Actually write to the sheet (default: dry run only).",
    )
    parser.add_argument(
        "--env", default=str(Path(__file__).resolve().parent.parent / ".env.local"),
        help="Path to .env.local (default: ../.env.local).",
    )
    args = parser.parse_args()

    env_path = Path(args.env)
    env = load_env(env_path)
    url = env.get("VITE_API_URL")
    secret = env.get("VITE_API_SECRET")
    if not url or not secret:
        print(f"ERROR: VITE_API_URL or VITE_API_SECRET missing from {env_path}", file=sys.stderr)
        return 2

    print(f"Target Apps Script: {url}")
    print(f"Mode: {'APPLY (will write)' if args.apply else 'DRY RUN (no writes)'}")

    print_phase_diff()
    print_settings_diff()

    if not args.apply:
        print("\nDry run complete. Re-run with --apply to write to the sheet.")
        return 0

    confirm = input("\nWrite these values to the sheet? [yes/N] ").strip().lower()
    if confirm not in {"yes", "y"}:
        print("Aborted.")
        return 1

    print("\nWriting…")
    for phase in PHASES:
        try:
            resp = call_webhook(url, secret, "upsertPhase", phase)
            print(f"  Phase {phase['id']} {phase['name']:<15} -> {resp.get('action', 'ok')}")
        except RuntimeError as e:
            print(f"  Phase {phase['id']} FAILED: {e}", file=sys.stderr)
            return 3

    try:
        resp = call_webhook(url, secret, "updateSettings", SETTINGS)
        updated = resp.get("updated", [])
        print(f"  Settings updated: {len(updated)} keys")
    except RuntimeError as e:
        print(f"  Settings FAILED: {e}", file=sys.stderr)
        return 3

    print("\nDone. Verify in the Sheet.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
