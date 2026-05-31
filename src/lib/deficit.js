// ============================================================
// Home rings + progress card calculations
// ============================================================
// Pure functions. All inputs (logs, lifts, settings) come from sync state.
// No hardcoded targets — phase shape comes from PHASES, working values
// (BMR, deficit window, program totals) from Settings tab.
// ============================================================

import { PHASES } from '../data/phases';
import { BMR_KATCH_MCARDLE, TEF_PERCENT } from '../data/constants';
import { daysBetween } from './helpers';

const REFEED_DEFAULT_DOW = 'Saturday';

// ----------------------------------------------------------------------------
// Day type — LIFT (has Lifts row today) | REFEED (matches refeed_schedule) | NO_LIFT
// ----------------------------------------------------------------------------
export const getDayType = (date, lifts = [], settings = {}) => {
  if (lifts.some(l => l.date === date)) return 'LIFT';
  const dow = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const refeedDay = settings.refeed_schedule || REFEED_DEFAULT_DOW;
  if (dow === refeedDay) return 'REFEED';
  return 'NO_LIFT';
};

// ----------------------------------------------------------------------------
// Ring targets per day type
// ----------------------------------------------------------------------------
export const getRingTargets = (date, dayType, settings = {}) => {
  const phase = PHASES.find(p => date >= p.startDate && date <= p.endDate) || PHASES[0];
  const dlo = Number(settings.deficit_target_daily_low) || 500;
  const dhi = Number(settings.deficit_target_daily_high) || 700;
  const deficit = Math.round((dlo + dhi) / 2);

  let carbs = phase.carbs;
  let calories = phase.calories;
  if (dayType === 'LIFT')   carbs = phase.carbs + 20;
  if (dayType === 'REFEED') { carbs = phase.carbs + 60; calories = phase.refeedCal; }

  return { deficit, calories, protein: phase.protein, carbs, fat: phase.fat, phase, dayType };
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
// ----------------------------------------------------------------------------
export const getPhaseProgress = (phase, currentDate, logs = {}, bmr, settings = {}) => {
  const totalDays = daysBetween(phase.startDate, phase.endDate) + 1;
  const daysElapsed = Math.min(Math.max(daysBetween(phase.startDate, currentDate) + 1, 1), totalDays);
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);
  const timePct = daysElapsed / totalDays;

  let cumulativeDeficit = 0;
  Object.values(logs).forEach(l => {
    if (l && l.date >= phase.startDate && l.date <= currentDate) {
      cumulativeDeficit += calcActualDeficit(l, bmr);
    }
  });

  // Target uses the average of the daily deficit window if set, else 600.
  const dlo = Number(settings.deficit_target_daily_low) || 500;
  const dhi = Number(settings.deficit_target_daily_high) || 700;
  const targetDaily = Math.round((dlo + dhi) / 2);
  const totalTargetDeficit = targetDaily * totalDays;
  const deficitPct = totalTargetDeficit > 0 ? cumulativeDeficit / totalTargetDeficit : 0;

  const remaining = totalTargetDeficit - cumulativeDeficit;
  const requiredDailyDeficit = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0;

  return {
    daysElapsed, totalDays, daysRemaining,
    timePct, deficitPct,
    cumulativeDeficit, totalTargetDeficit, targetDaily,
    requiredDailyDeficit,
  };
};

// ----------------------------------------------------------------------------
// Full 15-month program progress
// ----------------------------------------------------------------------------
export const getProgramProgress = (currentDate, logs = {}, settings = {}, bmr) => {
  const startDate = settings.program_start_date || PHASES[0].startDate;
  const endDate = settings.program_end_date || PHASES[PHASES.length - 1].endDate;
  const totalDays = Number(settings.program_total_days) || (daysBetween(startDate, endDate) + 1);
  const daysElapsed = Math.min(Math.max(daysBetween(startDate, currentDate) + 1, 1), totalDays);
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);
  const totalLbsToLose = Number(settings.program_total_lbs_to_lose) || 43.4;
  const totalDeficitTarget = Number(settings.program_total_deficit_target) || (totalLbsToLose * 3500);

  let cumulativeDeficit = 0;
  Object.values(logs).forEach(l => {
    if (l && l.date >= startDate && l.date <= currentDate) {
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
