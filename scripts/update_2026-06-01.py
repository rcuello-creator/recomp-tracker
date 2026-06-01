#!/usr/bin/env python3
"""Apply 2026-06-01 Phase 1 extension to the Google Sheet.

Phase 1 extends 28 -> 35 days (end 2026-06-14 -> 2026-06-21) for a sustainable
pace that preserves lean. Daily deficit target drops 675 -> 540 cal (the same
18,900 cal spread over 35 days instead of 28). Phases 2-5 cascade +7 days each;
the 15-month program total goes 471 -> 478 days (end 2027-08-31 -> 2027-09-07).

Mirrors scripts/update_phase1.py:
- `upsertPhase` (one per phase) updates the Phases tab.
- `updateSettings` (one batched call) upserts the Phase-1 extension keys.

Note: the PWA's "Necesitas/día" and Phase/Program day counts are computed
dynamically from the phase dates (src/data/phases.js) + program_total_days, so
the displayed 540/day and "Día 15 de 35 / 478" follow automatically once these
values land. The Settings keys below are recorded for audit/reference.

Dry-run by default. Pass --apply to write (asks for confirmation first).

Usage:
    python scripts/update_2026-06-01.py            # dry run
    python scripts/update_2026-06-01.py --apply    # confirm + write
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import urllib.request
import urllib.error


# ----------------------------------------------------------------------------
# Configuration — payloads (must match src/data/phases.js)
# ----------------------------------------------------------------------------

PHASES = [
    {
        "id": 1,
        "name": "Reset",
        "startDate": "2026-05-18",
        "endDate": "2026-06-21",
        "calories": 2200,
        "protein": 200,
        "carbs": 220,
        "fat": 55,
        "refeedCal": 2600,
        "description": "Extended 2026-06-01 - 35 days, sustainable pace, preserve lean",
    },
    {
        "id": 2,
        "name": "Cut Sostenido",
        "startDate": "2026-06-22",
        "endDate": "2026-08-07",
        "calories": 2100,
        "protein": 210,
        "carbs": 200,
        "fat": 50,
        "refeedCal": 2500,
        "description": "Cascade +7d 2026-06-01",
    },
    {
        "id": 3,
        "name": "Carb Cycling",
        "startDate": "2026-08-08",
        "endDate": "2026-11-07",
        "calories": 2130,
        "protein": 200,
        "carbs": 200,
        "fat": 50,
        "refeedCal": 2500,
        "description": "Cascade +7d 2026-06-01",
    },
    {
        "id": 4,
        "name": "Final Cut",
        "startDate": "2026-11-08",
        "endDate": "2027-03-07",
        "calories": 1950,
        "protein": 220,
        "carbs": 170,
        "fat": 45,
        "refeedCal": 2350,
        "description": "Cascade +7d 2026-06-01",
    },
    {
        "id": 5,
        "name": "Lean Phase",
        "startDate": "2027-03-08",
        "endDate": "2027-09-07",
        "calories": 1850,
        "protein": 220,
        "carbs": 150,
        "fat": 45,
        "refeedCal": 2250,
        "description": "Cascade +7d 2026-06-01",
    },
]

SETTINGS = {
    # Phase 1 extension
    "phase1_end_date": "2026-06-21",
    "phase1_total_days": 35,
    "phase1_daily_deficit_target": 540,  # 18,900 cal / 35 days
    "phase1_extension_date": "2026-06-01",
    "phase1_extension_reason": "Sustainable pace - preserve lean",
    # 15-month program totals (cascade +7d)
    "program_total_days": 478,
    "program_end_date": "2027-09-07",
    # Healthy ceiling for the "Necesitas/día" cap (CAMBIO 2). Override of the
    # 750 default baked into src/lib/deficit.js; sent here so it's auditable.
    "healthy_max_daily": 750,
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
    print(f"{'id':>2}  {'name':<14}  {'start':<10}  {'end':<10}  {'cal':>5}")
    for p in PHASES:
        print(
            f"{p['id']:>2}  {p['name']:<14}  {p['startDate']:<10}  "
            f"{p['endDate']:<10}  {p['calories']:>5}"
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
    parser = argparse.ArgumentParser(description="Apply 2026-06-01 Phase 1 extension to the Sheet.")
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

    print("\nDone. Verify in the Sheet, then run cleanupDuplicateDates() once "
          "from the Apps Script editor.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
