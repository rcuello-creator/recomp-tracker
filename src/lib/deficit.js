// ============================================================
// Home rings + progress card calculations
// ============================================================
// Pure functions. All inputs (logs, lifts, settings) come from sync state.
// No hardcoded targets — phase shape comes from PHASES, working values
// (BMR, deficit window, program totals) from Settings tab.
// ============================================================

import { PHASES } from '../data/phases';
import { BMR_KATCH_MCARDLE, TEF_PERCENT } from '../data/constants';
import { daysBetween, normalizeDate } from './helpers';

const REFEED_DEFAULT_DOW = 'Saturday';

// Healthy ceiling for the daily deficit we ASK the user to hit. Above this,
// sustained dieting risks lean-mass loss; the right lever is extending the
// timeline (see 2026-06-01 Phase 1 extension), not a deeper daily cut.
const HEALTHY_MAX_DAILY = 750;

// ----------------------------------------------------------------------------
// Day type — LIFT (Lifts row OR logs[date].liftDone) | REFEED (matches
// refeed_schedule) | STANDARD
//
// Reads from BOTH Lifts tab AND DailyLogs.liftDone so the badge updates the
// moment the user toggles "Lift hecho" in Home, even before the OCR agent
// processes the Future Pro screenshot (or if the user manually marks it).
// ----------------------------------------------------------------------------
export const getDayType = (date, lifts = [], settings = {}, logs = {}) => {
  if (lifts.some(l => l.date === date)) return 'LIFT';
  if (logs[date] && logs[date].liftDone) return 'LIFT';
  const dow = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const refeedDay = settings.refeed_schedule || settings.refeed_day || REFEED_DEFAULT_DOW;
  if (dow === refeedDay) return 'REFEED';
  return 'STANDARD';
};

// ----------------------------------------------------------------------------
// Ring targets per day type
// Settings keys (when present) override the phase defaults:
//   target_cal_standard / target_cal_lift / target_cal_refeed
//   target_prot_standard / target_prot_lift
//   target_carbs_standard / target_carbs_lift / target_carbs_refeed
//   target_fat_standard / target_fat_refeed
// ----------------------------------------------------------------------------
const dayKey = (t) => (t === 'LIFT' ? 'lift' : t === 'REFEED' ? 'refeed' : 'standard');

const pick = (settings, key, fallback) => {
  const v = settings[key];
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const getRingTargets = (date, dayType, settings = {}) => {
  const phase = PHASES.find(p => date >= p.startDate && date <= p.endDate) || PHASES[0];
  const dlo = pick(settings, 'deficit_target_daily_low', 500);
  const dhi = pick(settings, 'deficit_target_daily_high', 700);
  const deficit = Math.round((dlo + dhi) / 2);
  const dk = dayKey(dayType);

  // Phase-derived defaults (legacy path)
  let calories = phase.calories;
  let carbs = phase.carbs;
  if (dayType === 'LIFT')   carbs = phase.carbs + 20;
  if (dayType === 'REFEED') { carbs = phase.carbs + 60; calories = phase.refeedCal; }

  // Settings-driven overrides — preferred when present (post-2026-05-31 brief)
  calories = pick(settings, `target_cal_${dk}`, calories);
  const protein = pick(settings, `target_prot_${dk}`, phase.protein);
  carbs = pick(settings, `target_carbs_${dk}`, carbs);
  const fat = pick(settings, `target_fat_${dk}`, phase.fat);

  return { deficit, calories, protein, carbs, fat, phase, dayType };
};

// Active calorie ring target (dynamic by day type — fixes hardcoded "500+")
export const getActiveCalTarget = (dayType, settings = {}) => {
  const dk = dayKey(dayType);
  const defaults = { lift: 700, standard: 500, refeed: 400 };
  return pick(settings, `target_active_cal_${dk}`, defaults[dk]);
};

// Daily steps target (dynamic by day type — fixes hardcoded "10K")
// Settings: steps_no_lift / steps_lift_day. Refeed treated as no-lift.
export const getStepsTarget = (dayType, settings = {}) => {
  if (dayType === 'LIFT') return pick(settings, 'steps_lift_day', 7000);
  return pick(settings, 'steps_no_lift', 10000);
};

// ----------------------------------------------------------------------------
// TDEE & deficit for a single day
// ----------------------------------------------------------------------------
export const calcTDEE = (bmr, activeCal, caloriesConsumed) => {
  const tef = (caloriesConsumed || 0) * TEF_PERCENT;
  return Math.round((bmr || BMR_KATCH_MCARDLE) + (activeCal || 0) + tef);
};

export const calcActualDeficit = (log, bmr) => {
  if (!log) return 0;
  const consumed = log.calories || 0;
  const active = log.activeCal || 0;
  if (!consumed && !active) return 0;
  return calcTDEE(bmr, active, consumed) - consumed; // positive = deficit
};

// ----------------------------------------------------------------------------
// Phase progress — time elapsed vs total + cumulative deficit
//
// totalTargetDeficit precedence:
//   1. settings.weight_baseline_phase{N} & weight_target_phase{N}_end (lbs * 3500)
//   2. (deficit_target_daily_low + high) / 2 * totalDays (legacy window)
// ----------------------------------------------------------------------------
export const getPhaseProgress = (phase, currentDate, logs = {}, bmr, settings = {}) => {
  const phaseStart = normalizeDate(phase.startDate);
  const phaseEnd = normalizeDate(phase.endDate);
  const today = normalizeDate(currentDate);

  const totalDays = daysBetween(phaseStart, phaseEnd) + 1;
  const daysElapsed = Math.min(Math.max(daysBetween(phaseStart, today) + 1, 1), totalDays);
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);
  const timePct = daysElapsed / totalDays;

  let cumulativeDeficit = 0;
  Object.values(logs).forEach(l => {
    const d = normalizeDate(l && l.date);
    if (d && d >= phaseStart && d <= today) {
      cumulativeDeficit += calcActualDeficit(l, bmr);
    }
  });

  // Prefer phase-specific weight targets (Bug 3 fix). For Phase 1 these are
  // weight_baseline_phase1=223.4 & weight_target_phase1_end=218 → 5.4 lbs *
  // 3500 = 18,900. Falls back to deficit window if phase keys are absent.
  const wBaseline = pick(settings, `weight_baseline_phase${phase.id}`, null);
  const wEnd = pick(settings, `weight_target_phase${phase.id}_end`, null);
  let totalTargetDeficit;
  let targetDaily;
  if (wBaseline != null && wEnd != null && wBaseline > wEnd) {
    const lbsToLose = wBaseline - wEnd;
    totalTargetDeficit = lbsToLose * 3500;
    targetDaily = totalDays > 0 ? Math.round(totalTargetDeficit / totalDays) : 0;
  } else {
    const dlo = pick(settings, 'deficit_target_daily_low', 500);
    const dhi = pick(settings, 'deficit_target_daily_high', 700);
    targetDaily = Math.round((dlo + dhi) / 2);
    totalTargetDeficit = targetDaily * totalDays;
  }
  const deficitPct = totalTargetDeficit > 0 ? cumulativeDeficit / totalTargetDeficit : 0;

  const remaining = totalTargetDeficit - cumulativeDeficit;
  const requiredDailyRaw = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0;

  // Healthy ceiling on what we ASK the user to hit per day. If falling behind
  // pushes the raw "catch-up" math above this, asking for it risks lean loss —
  // so we cap the displayed/suggested target and flag the gap as aggressive.
  // The phase end shifting (extending the timeline) is the healthy lever, not
  // a bigger daily deficit. Settings key `healthy_max_daily` overrides 750.
  const healthyMaxDaily = pick(settings, 'healthy_max_daily', HEALTHY_MAX_DAILY);
  const requiredDailyDeficit = Math.min(requiredDailyRaw, healthyMaxDaily);
  const isAggressive = requiredDailyRaw > healthyMaxDaily;

  return {
    daysElapsed, totalDays, daysRemaining,
    timePct, deficitPct,
    cumulativeDeficit, totalTargetDeficit, targetDaily,
    // requiredDailyDeficit is the healthy, capped value (primary display /
    // today's target). requiredDailyRaw is the uncapped catch-up math.
    requiredDailyDeficit, requiredDailyRaw, isAggressive, healthyMaxDaily,
  };
};

// ----------------------------------------------------------------------------
// Full 15-month program progress
// Defensive normalizeDate on every settings/log date — Settings values come
// back as ISO timestamps from Google Sheets and break naïve date math.
// ----------------------------------------------------------------------------
export const getProgramProgress = (currentDate, logs = {}, settings = {}, bmr) => {
  const startDate = normalizeDate(settings.program_start_date) || normalizeDate(PHASES[0].startDate);
  const endDate = normalizeDate(settings.program_end_date) || normalizeDate(PHASES[PHASES.length - 1].endDate);
  const today = normalizeDate(currentDate);

  const totalDays = pick(settings, 'program_total_days', daysBetween(startDate, endDate) + 1);
  const daysElapsed = Math.min(Math.max(daysBetween(startDate, today) + 1, 1), totalDays);
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);
  const totalLbsToLose = pick(settings, 'program_total_lbs_to_lose', 43.4);
  const totalDeficitTarget = pick(settings, 'program_total_deficit_target', totalLbsToLose * 3500);

  let cumulativeDeficit = 0;
  Object.values(logs).forEach(l => {
    const d = normalizeDate(l && l.date);
    if (d && d >= startDate && d <= today) {
      cumulativeDeficit += calcActualDeficit(l, bmr);
    }
  });

  return {
    daysElapsed, totalDays, daysRemaining,
    timePct: daysElapsed / totalDays,
    deficitPct: totalDeficitTarget > 0 ? cumulativeDeficit / totalDeficitTarget : 0,
    cumulativeDeficit, totalDeficitTarget,
    totalLbsToLose,
    lbsLostEstimated: cumulativeDeficit / 3500,
    lbsRemaining: totalLbsToLose - (cumulativeDeficit / 3500),
  };
};
