// ============================================================
// 5-phase plan to Aug 2027
// ============================================================
// Last adjusted: 2026-05-29 — BMR correction (1818 → 1770) after 13-day
// plateau in Phase 1. Cascade re-targeted across all 5 phases.
// TODO refactor: PWA reads phases from this constant; sheet's Phases tab
// is a duplicate. Move to single source of truth (sheet → sync.phases)
// next sprint.
// ============================================================

export const PHASES = [
  {
    id: 1,
    name: 'Reset',
    startDate: '2026-05-18',
    endDate: '2026-06-14',
    calories: 2200,
    protein: 200,
    carbs: 220,
    fat: 55,
    refeedCal: 2600,
    description: 'Reset post-CKO2 + recovery lumbar. Adjusted 2026-05-29 (BMR 1770).',
  },
  {
    id: 2,
    name: 'Cut Sostenido',
    startDate: '2026-06-15',
    endDate: '2026-07-31',
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
    startDate: '2026-08-01',
    endDate: '2026-10-31',
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
    startDate: '2026-11-01',
    endDate: '2027-02-28',
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
    startDate: '2027-03-01',
    endDate: '2027-08-31',
    calories: 1850,
    protein: 220,
    carbs: 150,
    fat: 45,
    refeedCal: 2250,
    description: 'Último tramo a 180 lbs. 12% BF.',
  },
];
