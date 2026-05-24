// ============================================================
// Seed data — pre-loaded so app works even before first Sheet sync
// Sheet is source of truth; this only fills the gap on first load
// ============================================================

export const STARFIT_SEED = [
  { date: '2026-05-02', weight: 225.2, bodyFat: 35.1, leanMass: 146.2, fatMass: 79.0, context: 'Pre-crucero baseline' },
  { date: '2026-05-09', weight: 224.4, bodyFat: 35.6, leanMass: 144.5, fatMass: 79.9, context: 'Post-crucero dehydrated' },
  { date: '2026-05-10', weight: 224.6, bodyFat: 35.5, leanMass: 144.9, fatMass: 79.7, context: 'Recovery day' },
  { date: '2026-05-16', weight: 224.8, bodyFat: 36.7, leanMass: 142.3, fatMass: 82.5, context: 'Post-CKO2 sin creatina 7d' },
  { date: '2026-05-17', weight: 223.4, bodyFat: 35.9, leanMass: 143.2, fatMass: 80.2, context: 'Post-baño AM fasted · Baseline Fase 1' },
];

export const LIFTS_SEED = [
  { date: '2026-04-29', coach: 'Dylon', session: 'Legs PR', type: 'Legs', volume: 5240, duration: 60, avgBpm: null, calories: null, notes: 'PR all-time piernas', flag: 'pr' },
  { date: '2026-05-03', coach: 'Dylon', session: 'Finish-Line Fri', type: 'Mixed', volume: 2160, duration: null, avgBpm: null, calories: null, notes: 'Crucero día 2', flag: null },
  { date: '2026-05-04', coach: 'Josiah', session: 'Functional', type: 'Functional', volume: 2130, duration: null, avgBpm: null, calories: null, notes: 'Crucero día 3', flag: null },
  { date: '2026-05-06', coach: 'Dylon', session: 'Legs', type: 'Legs', volume: 4945, duration: null, avgBpm: null, calories: null, notes: 'PR crucero 94% del all-time', flag: 'pr' },
  { date: '2026-05-08', coach: 'Dylon', session: 'Flex Friday', type: 'Upper', volume: 1030, duration: 68, avgBpm: 107, calories: 419, notes: 'Último día crucero', flag: null },
  { date: '2026-05-11', coach: 'Dylon', session: '#33', type: 'Mixed', volume: 1799, duration: 107, avgBpm: 109, calories: 665, notes: 'Pre-vuelo LAX', flag: null },
  { date: '2026-05-13', coach: 'Dylon', session: '#34 Glutes', type: 'Legs', volume: 4390, duration: 66, avgBpm: 114, calories: 439, notes: 'Hotel LAX RDL dolor lumbar set incompleto', flag: 'injury' },
  { date: '2026-05-17', coach: 'Dylon', session: '#35 Finish-Line Fri', type: 'Mixed', volume: 2295, duration: 79, avgBpm: 119, calories: 549, notes: 'Zone 2 dominante 46% · Post-CKO2 recovery', flag: null },
];

export const PRESET_MEALS = [
  // Desayunos
  { id: 'breakfast-a', category: 'Desayuno', name: 'Eggs + Cottage', emoji: '🍳', cal: 450, prot: 52, carbs: 30, fat: 14,
    detail: '3 huevos + 2 claras + 1 taza cottage 2% + 1/2 taza berries' },
  { id: 'breakfast-b', category: 'Desayuno', name: 'Greek Yogurt Bowl', emoji: '🥣', cal: 440, prot: 50, carbs: 40, fat: 8,
    detail: '1 taza Greek yogurt 0% + 1 scoop whey + 1/2 banana + 30g granola' },
  { id: 'breakfast-c', category: 'Desayuno', name: 'Quest + Huevos', emoji: '🥤', cal: 460, prot: 55, carbs: 25, fat: 18,
    detail: 'Quest shake + 3 huevos enteros + 1 fruta' },
  
  // Almuerzos
  { id: 'lunch-1', category: 'Almuerzo', name: 'Bowl Asiático', emoji: '🍱', cal: 600, prot: 50, carbs: 60, fat: 15,
    detail: '200g pollo plancha + 1 taza arroz integral + brócoli/zanahoria + 1 cda aceite sésamo' },
  { id: 'lunch-2', category: 'Almuerzo', name: 'Tex-Mex Bowl', emoji: '🌮', cal: 610, prot: 52, carbs: 58, fat: 16,
    detail: '200g turkey 93/7 + 1/2 taza arroz + 1/2 taza black beans + pico + 30g aguacate' },
  { id: 'lunch-3', category: 'Almuerzo', name: 'Mediterráneo', emoji: '🥗', cal: 590, prot: 48, carbs: 55, fat: 17,
    detail: '200g pollo grilled + 1 papa asada + ensalada con 30g feta + 1 cda aceite oliva' },
  { id: 'lunch-4', category: 'Almuerzo', name: 'Quick Atún', emoji: '🐟', cal: 560, prot: 55, carbs: 50, fat: 12,
    detail: '2 latas atún + 1 lata jurel + 80g arroz + verduras + 1 cda mayo light' },
  
  // Cena
  { id: 'dinner-adj', category: 'Cena', name: 'Cena ajustada', emoji: '🍽', cal: 600, prot: 50, carbs: 50, fat: 20,
    detail: '8 oz proteína + 150g carbs cocidos + verduras libres + grasa controlada' },
  
  // Pre-bed
  { id: 'prebed', category: 'Pre-bed', name: 'Casein/Cottage', emoji: '🌙', cal: 200, prot: 30, carbs: 5, fat: 8,
    detail: '1 scoop casein o 1 taza cottage cheese + canela + 1 cda mantequilla almendras' },
  
  // Snacks
  { id: 'snack-premier', category: 'Snack', name: 'Premier Shake', emoji: '🥛', cal: 160, prot: 30, carbs: 4, fat: 4, detail: '11oz Premier Protein' },
  { id: 'snack-quest', category: 'Snack', name: 'Quest Bar', emoji: '🍫', cal: 200, prot: 21, carbs: 22, fat: 8, detail: '60g Quest bar' },
  { id: 'snack-jerky', category: 'Snack', name: 'Beef Jerky', emoji: '🥩', cal: 100, prot: 14, carbs: 4, fat: 2, detail: '1 paquete Jack Link\'s' },
  { id: 'snack-banana', category: 'Snack', name: 'Banana', emoji: '🍌', cal: 105, prot: 1, carbs: 27, fat: 0, detail: '1 banana mediana' },
  { id: 'snack-apple', category: 'Snack', name: 'Manzana', emoji: '🍎', cal: 95, prot: 0, carbs: 25, fat: 0, detail: '1 manzana mediana' },
  { id: 'snack-yogurt', category: 'Snack', name: 'Greek Yogurt', emoji: '🥄', cal: 100, prot: 17, carbs: 6, fat: 0, detail: '1 taza Greek yogurt 0%' },
];

export const SETTINGS_DEFAULT = {
  travelMode: false,
  injuryActive: true,
  physioBooked: false,
  currentPhase: 1,
};
