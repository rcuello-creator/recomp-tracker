// ============================================================
// 5-phase plan to Sep 2027
// ============================================================
// Last adjusted: 2026-06-01 — Phase 1 extended 28 → 35 days (end 2026-06-14
// → 2026-06-21) for a sustainable pace that preserves lean. Daily deficit
// target drops 675 → 540 (18,900 cal over 35 days). Phases 2–5 cascade +7
// days each; program total 471 → 478 days.
// Prior: 2026-05-29 — BMR correction (1818 → 1770) after 13-day plateau.
// TODO refactor: PWA reads phases from this constant; sheet's Phases tab
// is a duplicate. Move to single source of truth (sheet → sync.phases)
// next sprint.
// ============================================================

export const PHASES = [
  {
    id: 1,
    name: 'Reset',
    startDate: '2026-05-18',
    endDate: '2026-06-21',
    calories: 2200,
    protein: 200,
    carbs: 220,
    fat: 55,
    refeedCal: 2600,
    description: 'Reset post-CKO2 + recovery lumbar. Extended 2026-06-01 (35 días, pace sostenible).',
  },
  {
    id: 2,
    name: 'Cut Sostenido',
    startDate: '2026-06-22',
    endDate: '2026-08-07',
    calories: 2100,
    protein: 210,
    carbs: 200,
    fat: 50,
    refeedCal: 2500,
    description: 'Déficit estable. Pre-panel hormonal agosto.',
  },
  {
    id: 3,
    name: 'Carb Cycling',
    startDate: '2026-08-08',
    endDate: '2026-11-07',
    calories: 2130,
    protein: 200,
    carbs: 200,
    fat: 50,
    refeedCal: 2500,
    description: 'Ciclado de carbs. Optimizar performance.',
  },
  {
    id: 4,
    name: 'Final Cut',
    startDate: '2026-11-08',
    endDate: '2027-03-07',
    calories: 1950,
    protein: 220,
    carbs: 170,
    fat: 45,
    refeedCal: 2350,
    description: 'Déficit agresivo. Protección lean máxima.',
  },
  {
    id: 5,
    name: 'Lean Phase',
    startDate: '2027-03-08',
    endDate: '2027-09-07',
    calories: 1850,
    protein: 220,
    carbs: 150,
    fat: 45,
    refeedCal: 2250,
    description: 'Último tramo a 180 lbs. 12% BF.',
  },
];
