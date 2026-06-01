// ============================================================
// Helpers
// ============================================================

import { PHASES } from '../data/phases';
import { SCORE_WEIGHTS, BMR_KATCH_MCARDLE, TEF_PERCENT } from '../data/constants';

// Local-time YYYY-MM-DD. Was using `toISOString().split('T')[0]` which returns
// the UTC date — after 8pm EDT (Florida), UTC has already rolled over to the
// next day, so the app showed "1 junio" when locally it was still "31 mayo"
// and saveLog wrote rows under the wrong date key. 'sv-SE' locale formats
// dates as YYYY-MM-DD using local time.
export const today = () => new Date().toLocaleDateString('sv-SE');

// Defensive YYYY-MM-DD coercion — Settings tab values come back as ISO
// timestamps ("2026-05-18T04:00:00.000Z") from Google Sheets when set via
// `setValue(date)`. sheetToObjects strips Date objects to YYYY-MM-DD but
// Settings live in a 2-col key/value layout where the date string survives.
// Without this, `daysBetween` concatenates "...T04...Z" + "T00:00:00" → NaN.
export const normalizeDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  }
  const s = String(d);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

export const daysBetween = (d1, d2) => {
  const n1 = normalizeDate(d1);
  const n2 = normalizeDate(d2);
  if (!n1 || !n2) return NaN;
  const date1 = new Date(n1 + 'T00:00:00');
  const date2 = new Date(n2 + 'T00:00:00');
  return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const formatDateLong = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Local HH:MM from an ISO timestamp (e.g. log.updatedAt). Returns null for
// missing/unparseable input so callers can hide the label entirely.
export const formatTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export const getCurrentPhase = (date = today()) => {
  return PHASES.find(p => date >= p.startDate && date <= p.endDate) || PHASES[0];
};

export const getTodayTargets = (travelMode = false, date = today()) => {
  const phase = getCurrentPhase(date);
  if (travelMode) {
    return { calories: 2500, protein: 200, carbs: phase.carbs, fat: 85, mode: 'travel', phase: phase.name };
  }
  const isSaturday = new Date(date + 'T00:00:00').getDay() === 6;
  return {
    calories: isSaturday ? phase.refeedCal : phase.calories,
    protein: phase.protein,
    carbs: isSaturday ? Math.round(phase.carbs * 1.4) : phase.carbs,
    fat: phase.fat,
    mode: isSaturday ? 'refeed' : 'normal',
    phase: phase.name,
  };
};

export const calculateTDEE = (activeCal, caloriesConsumed) => {
  const active = activeCal || 0;
  const tef = (caloriesConsumed || 0) * TEF_PERCENT;
  return Math.round(BMR_KATCH_MCARDLE + active + tef);
};

export const calculateDeficit = (caloriesConsumed, activeCal) => {
  if (!caloriesConsumed && !activeCal) return null;
  const tdee = calculateTDEE(activeCal, caloriesConsumed);
  return (caloriesConsumed || 0) - tdee;
};

export const calculateScore = (log, targets) => {
  if (!log) return 0;
  let score = 0;
  let max = 0;
  
  max += SCORE_WEIGHTS.protein;
  if (log.protein >= targets.protein) score += SCORE_WEIGHTS.protein;
  else if (log.protein >= targets.protein - 20) score += SCORE_WEIGHTS.protein * 0.7;
  else if (log.protein >= targets.protein - 40) score += SCORE_WEIGHTS.protein * 0.35;
  
  max += SCORE_WEIGHTS.calories;
  const calDiff = Math.abs((log.calories || 0) - targets.calories);
  if (calDiff <= 150) score += SCORE_WEIGHTS.calories;
  else if (calDiff <= 300) score += SCORE_WEIGHTS.calories * 0.6;
  else if (calDiff <= 500) score += SCORE_WEIGHTS.calories * 0.2;
  
  max += SCORE_WEIGHTS.fat;
  if (log.fat && log.fat <= targets.fat) score += SCORE_WEIGHTS.fat;
  else if (log.fat && log.fat <= targets.fat + 10) score += SCORE_WEIGHTS.fat * 0.6;
  else if (log.fat && log.fat <= targets.fat + 25) score += SCORE_WEIGHTS.fat * 0.2;
  
  max += SCORE_WEIGHTS.lift;
  if (log.liftDone) score += SCORE_WEIGHTS.lift;
  
  max += SCORE_WEIGHTS.sleep;
  if (log.sleep >= 7) score += SCORE_WEIGHTS.sleep;
  else if (log.sleep >= 6) score += SCORE_WEIGHTS.sleep * 0.5;
  
  max += SCORE_WEIGHTS.creatine;
  if (log.creatine) score += SCORE_WEIGHTS.creatine;
  
  max += SCORE_WEIGHTS.alcohol;
  if (!log.alcohol || log.alcohol === 0) score += SCORE_WEIGHTS.alcohol;
  else if (log.alcohol <= 2) score += SCORE_WEIGHTS.alcohol * 0.6;
  
  return Math.round((score / max) * 100);
};

export const scoreColor = (score) => {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return '#ef4444';
};

export const deficitColor = (deficit) => {
  if (deficit === null) return '#9ca3af';
  if (deficit > 200) return '#10b981';
  if (deficit > -300) return '#10b981';
  if (deficit > -700) return '#f59e0b';
  if (deficit > -1000) return '#f97316';
  return '#ef4444';
};

export const deficitLabel = (deficit) => {
  if (deficit === null) return '—';
  if (deficit > 200) return 'Surplus';
  if (deficit > -300) return 'Mantenimiento';
  if (deficit > -700) return 'Déficit moderado';
  if (deficit > -1000) return 'Déficit agresivo';
  return 'Déficit extremo';
};
