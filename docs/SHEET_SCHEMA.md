# Sheet Schema

Estructura exacta de los 6 tabs en el Google Sheet.

⚠️ **Los headers deben coincidir EXACTAMENTE** (case-sensitive, sin espacios extras). El Apps Script depende de esto.

---

## Tab 1: `DailyLogs`

Una fila por día. La app hace upsert por `date`.

| date | calories | protein | carbs | fat | liftDone | liftVolume | sleep | alcohol | steps | creatine | notes | adherenceScore | updatedAt |
|------|----------|---------|-------|-----|----------|------------|-------|---------|-------|----------|-------|----------------|-----------|

**Tipos:**
- `date`: YYYY-MM-DD (string)
- `calories`, `protein`, `carbs`, `fat`, `liftVolume`, `steps`, `adherenceScore`: number
- `sleep`: number (decimal, ej 7.5)
- `alcohol`: int (0-10)
- `liftDone`, `creatine`: boolean (TRUE/FALSE)
- `notes`: string
- `updatedAt`: ISO datetime (auto)

---

## Tab 2: `StarfitScans`

Una fila por scan BIA. Append-only.

| date | weight | bodyFat | leanMass | fatMass | bodyScore | bodyWater | visceralFat | bmr | context | createdAt |
|------|--------|---------|----------|---------|-----------|-----------|-------------|-----|---------|-----------|

**Tipos:**
- `date`: YYYY-MM-DD
- `weight`, `leanMass`, `fatMass`, `bodyWater`: number (lbs, 1 decimal)
- `bodyFat`: number (%, 1 decimal)
- `bodyScore`, `visceralFat`, `bmr`: int
- `context`: string (ej "Post-CKO2 sin creatina 7d")

---

## Tab 3: `Lifts`

Una fila por sesión de entrenamiento.

| date | coach | session | type | volume | duration | avgBpm | calories | notes | flag | createdAt |
|------|-------|---------|------|--------|----------|--------|----------|-------|------|-----------|

**Tipos:**
- `date`: YYYY-MM-DD
- `coach`: string ("Dylon", "Josiah", "Solo", etc)
- `session`: string ("#34 Glutes", "Flex Friday", etc)
- `type`: enum ("Legs", "Upper", "Mixed", "Functional")
- `volume`: int (lbs)
- `duration`: int (min, nullable)
- `avgBpm`, `calories`: int (nullable)
- `notes`: string
- `flag`: enum (null, "pr", "injury", "deload")

---

## Tab 4: `DexaScans`

Una fila por DEXA cada 90 días.

| date | weight | leanMass | fatMass | bodyFat | bmr | visceralFat | almi | ffmi | tScore | bmc | facility | notes | createdAt |
|------|--------|----------|---------|---------|-----|-------------|------|------|--------|-----|----------|-------|-----------|

**Tipos:**
- `date`: YYYY-MM-DD
- `weight`, `leanMass`, `fatMass`, `visceralFat`, `bmc`: number (lbs, 2 decimals)
- `bodyFat`: number (%, 1 decimal)
- `bmr`: int
- `almi`, `ffmi`: number (1 decimal)
- `tScore`: number (2 decimals)
- `facility`: string (ej "BodySpec Weston")
- `notes`: string

**Seed:**
- 2026-04-10 baseline

---

## Tab 5: `Settings`

Key-value para configuración persistente.

| key | value | updatedAt |
|-----|-------|-----------|

**Keys iniciales:**
```
travelMode       | false
injuryActive     | true
physioBooked     | false
currentPhase     | 1
nextDexaDate     | 2026-07-10
nextStarfitDate  | 2026-05-23
```

---

## Tab 6: `Phases` (read-only desde la app)

Referencia de las 5 fases. No se edita desde la app, solo para que el script pueda leer.

| id | name | startDate | endDate | calories | protein | carbs | fat | refeedCal | description |
|----|------|-----------|---------|----------|---------|-------|-----|-----------|-------------|

**Seed:**
```
1 | Reset          | 2026-05-18 | 2026-06-14 | 2400 | 200 | 240 | 65 | 2800 | Restart post-CKO2
2 | Cut Sostenido  | 2026-06-15 | 2026-07-31 | 2300 | 210 | 220 | 60 | 2700 | Pre-panel hormonal
3 | Carb Cycling   | 2026-08-01 | 2026-10-31 | 2330 | 200 | 220 | 60 | 2700 | Ciclado optimizar perf
4 | Final Cut      | 2026-11-01 | 2027-02-28 | 2100 | 220 | 180 | 50 | 2500 | Déficit agresivo
5 | Lean Phase     | 2027-03-01 | 2027-08-31 | 2000 | 220 | 160 | 50 | 2400 | Último tramo a 180
```

---

## Setup inicial — Script para auto-crear

Si querés evitar crear tabs manualmente, podés correr esta función una sola vez desde el Apps Script editor:

```javascript
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  const schemas = {
    'DailyLogs': ['date','calories','protein','carbs','fat','liftDone','liftVolume','sleep','alcohol','steps','creatine','notes','adherenceScore','updatedAt'],
    'StarfitScans': ['date','weight','bodyFat','leanMass','fatMass','bodyScore','bodyWater','visceralFat','bmr','context','createdAt'],
    'Lifts': ['date','coach','session','type','volume','duration','avgBpm','calories','notes','flag','createdAt'],
    'DexaScans': ['date','weight','leanMass','fatMass','bodyFat','bmr','visceralFat','almi','ffmi','tScore','bmc','facility','notes','createdAt'],
    'Settings': ['key','value','updatedAt'],
    'Phases': ['id','name','startDate','endDate','calories','protein','carbs','fat','refeedCal','description'],
  };
  
  Object.entries(schemas).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });
  
  Logger.log('Sheets initialized');
}
```

Después correr una vez `seedInitialData()` (también en Code.gs) para cargar:
- DEXA baseline 10 Abr 2026
- 4 scans Starfit
- 7 lifts
- 5 fases
- 6 settings
