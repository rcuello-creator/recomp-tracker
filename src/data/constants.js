// ============================================================
// Core constants
// ============================================================

export const DEXA_BASELINE = {
  date: '2026-04-10',
  weight: 222.8,
  leanMass: 147.8,
  fatMass: 69.0,
  bodyFat: 30.8,
  bmr: 1818,
  visceralFat: 0.62,
  ALMI: 9.2,
  FFMI: 21.5,
  tScore: 0.20,
  bmc: 6.25,
  facility: 'BodySpec Weston',
};

export const TARGET_FINAL = {
  weight: 180,
  leanMass: 158,
  fatMass: 22,
  bodyFat: 12,
  date: '2027-08-31',
};

export const BMR_KATCH_MCARDLE = 1818; // Calculado desde DEXA lean mass
export const TEF_PERCENT = 0.10; // Thermic Effect of Food

export const SCORE_WEIGHTS = {
  protein: 28,
  calories: 18,
  fat: 18,
  lift: 13,
  sleep: 10,
  creatine: 8,
  alcohol: 5,
};

export const MILESTONES = [
  { date: '2026-05-18', label: 'Inicio Fase 1 real', weight: 223.4, bf: 35.9, lean: 143.2 },
  { date: '2026-08-01', label: 'Mes 3 — Panel hormonal', weight: 213, bf: 27.5, lean: 149.5 },
  { date: '2026-11-01', label: 'Mes 6 — Punto medio', weight: 203, bf: 25, lean: 151.5 },
  { date: '2027-02-01', label: 'Mes 9 — Recomp visible', weight: 194, bf: 21, lean: 153.5 },
  { date: '2027-05-01', label: 'Mes 12 — Traje 2 tallas', weight: 187, bf: 17, lean: 155.5 },
  { date: '2027-08-31', label: 'Target — 180 lbs / 12% BF', weight: 180, bf: 12, lean: 158 },
];
