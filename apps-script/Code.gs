// ============================================================
// Recomp Tracker — Google Apps Script Backend
// ============================================================
// Deploy as Web App:
//   - Execute as: Me
//   - Who has access: Anyone
// 
// Replace SECRET and SHEET_ID below before deploying.
// ============================================================

const SECRET = 'CHANGE_ME_32_CHARS_RANDOM_STRING';
const SHEET_ID = 'CHANGE_ME_SHEET_ID_FROM_URL';

// ============================================================
// ENTRY POINTS
// ============================================================

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    
    if (body.secret !== SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    switch (body.action) {
      case 'saveLog': return jsonResponse(saveLog(ss, body.data));
      case 'saveScan': return jsonResponse(saveScan(ss, body.data));
      case 'saveLift': return jsonResponse(saveLift(ss, body.data));
      case 'saveDexa': return jsonResponse(saveDexa(ss, body.data));
      case 'updateSettings': return jsonResponse(updateSettings(ss, body.data));
      case 'upsertPhase': return jsonResponse(upsertPhase(ss, body.data));
      case 'migrate': return jsonResponse(migrate(ss, body.data));
      case 'cleanupEmptyLifts': return jsonResponse(cleanupEmptyLifts(ss));
      case 'getHistory': return jsonResponse(getHistory(ss));
      case 'syncBatch': return jsonResponse(syncBatch(ss, body.data));
      default: return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

function doGet(e) {
  try {
    if (e.parameter.secret !== SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const ss = SpreadsheetApp.openById(SHEET_ID);
    return jsonResponse(getHistory(ss));
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// WRITE ACTIONS
// ============================================================

function saveLog(ss, data) {
  const sheet = ss.getSheetByName('DailyLogs');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const dateCol = headers.indexOf('date');

  // Normalize cell value to "YYYY-MM-DD" — Google Sheets may return a Date
  // object instead of a string, which breaks strict equality with data.date.
  function cellAsDateStr(v) {
    if (v instanceof Date) return Utilities.formatDate(v, 'GMT', 'yyyy-MM-dd');
    return String(v || '');
  }

  // Find existing row by date.
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (cellAsDateStr(values[i][dateCol]) === data.date) {
      rowIndex = i + 1;
      break;
    }
  }

  const previous = rowIndex > 0 ? values[rowIndex - 1] : null;

  // MERGE semantics: for each column, prefer the incoming value when the
  // payload actually carries one; otherwise keep what was already there.
  // This lets Apple Watch screenshots (steps/notes only) coexist with Noom
  // screenshots (macros only) on the same day without clobbering each other.
  const row = headers.map((h, idx) => {
    if (h === 'updatedAt') return new Date().toISOString();
    if (Object.prototype.hasOwnProperty.call(data, h) && data[h] !== null && data[h] !== '') {
      return data[h];
    }
    if (previous) return previous[idx];
    return '';
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { success: true, date: data.date, action: 'updated' };
  }
  sheet.appendRow(row);
  return { success: true, date: data.date, action: 'inserted' };
}

function saveScan(ss, data) {
  const sheet = ss.getSheetByName('StarfitScans');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(h => {
    if (h === 'createdAt') return new Date().toISOString();
    if (data[h] === undefined || data[h] === null) return '';
    return data[h];
  });
  
  sheet.appendRow(row);
  return { success: true, scan: data };
}

function saveLift(ss, data) {
  const sheet = ss.getSheetByName('Lifts');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(h => {
    if (h === 'createdAt') return new Date().toISOString();
    if (data[h] === undefined || data[h] === null) return '';
    return data[h];
  });
  
  sheet.appendRow(row);
  return { success: true, lift: data };
}

function saveDexa(ss, data) {
  const sheet = ss.getSheetByName('DexaScans');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(h => {
    if (h === 'createdAt') return new Date().toISOString();
    if (data[h] === undefined || data[h] === null) return '';
    return data[h];
  });
  
  sheet.appendRow(row);
  return { success: true, dexa: data };
}

function cleanupEmptyLifts(ss) {
  // Delete rows from the Lifts tab where both `session` and `volume` are
  // empty — these are residue from OCR runs where the Future Pro extractor
  // fired with no useful data. Iterates bottom-up to keep row indices stable.
  const sheet = ss.getSheetByName('Lifts');
  if (!sheet) throw new Error('Lifts sheet not found');
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { success: true, deleted: 0 };

  const headers = values[0];
  const sessCol = headers.indexOf('session');
  const volCol = headers.indexOf('volume');
  if (sessCol < 0 || volCol < 0) throw new Error('Lifts schema missing session/volume');

  const toDelete = [];
  for (let i = 1; i < values.length; i++) {
    const sess = String(values[i][sessCol] || '').trim();
    const vol = values[i][volCol];
    const volEmpty = vol === '' || vol === null || vol === undefined;
    if (!sess && volEmpty) toDelete.push(i + 1); // sheet rows are 1-indexed
  }
  // Bottom-up to preserve indices
  for (let r = toDelete.length - 1; r >= 0; r--) {
    sheet.deleteRow(toDelete[r]);
  }
  return { success: true, deleted: toDelete.length, rows: toDelete };
}

function migrate(ss, data) {
  // Idempotent schema migration: ensures the requested columns exist on each
  // tab. Adds missing columns at the END (never inserts mid-row — avoids
  // shifting existing data). Returns per-tab summary of which columns were
  // added vs already present.
  //
  // Payload shape:
  //   { tabs: { DailyLogs: ['activeCal', 'newCol'], StarfitScans: ['skeletal_muscle'] } }
  if (!data || !data.tabs) throw new Error('migrate requires data.tabs');

  const summary = {};
  Object.entries(data.tabs).forEach(function (entry) {
    const tabName = entry[0];
    const wanted = entry[1] || [];
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      summary[tabName] = { error: 'tab not found' };
      return;
    }
    const lastCol = sheet.getLastColumn();
    const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    const added = [];
    const present = [];
    wanted.forEach(function (col) {
      if (headers.indexOf(col) >= 0) {
        present.push(col);
      } else {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
        added.push(col);
      }
    });
    summary[tabName] = { added: added, present: present };
  });

  return { success: true, summary: summary };
}

function upsertPhase(ss, data) {
  // Upsert a single phase row by `id`. Headers in Phases tab:
  //   id, name, startDate, endDate, calories, protein, carbs, fat, refeedCal, description
  // If a row with matching id exists, update its columns in place; otherwise append.
  if (data == null || data.id == null) {
    throw new Error('upsertPhase requires data.id');
  }
  const sheet = ss.getSheetByName('Phases');
  if (!sheet) throw new Error('Phases sheet not found');

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Phases sheet missing `id` header');

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  // Build the row from headers — values that aren't in `data` keep their previous
  // value (for updates) or default to '' (for inserts). Never invent fields.
  const previous = rowIndex > 0 ? values[rowIndex - 1] : headers.map(() => '');
  const row = headers.map((h, idx) => {
    if (data[h] === undefined) return previous[idx] !== undefined ? previous[idx] : '';
    if (data[h] === null) return '';
    return data[h];
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { success: true, phase: data.id, action: 'updated' };
  }
  sheet.appendRow(row);
  return { success: true, phase: data.id, action: 'inserted' };
}

function updateSettings(ss, data) {
  const sheet = ss.getSheetByName('Settings');
  const values = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  
  Object.entries(data).forEach(([key, value]) => {
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 3).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, value, now]);
    }
  });
  
  return { success: true, updated: Object.keys(data) };
}

function syncBatch(ss, batch) {
  // Process multiple offline-queued operations in one request
  const results = [];
  batch.forEach(op => {
    try {
      switch (op.action) {
        case 'saveLog': results.push(saveLog(ss, op.data)); break;
        case 'saveScan': results.push(saveScan(ss, op.data)); break;
        case 'saveLift': results.push(saveLift(ss, op.data)); break;
        case 'updateSettings': results.push(updateSettings(ss, op.data)); break;
      }
    } catch (e) {
      results.push({ error: e.toString(), op });
    }
  });
  return { success: true, results };
}

// ============================================================
// READ
// ============================================================

function getHistory(ss) {
  return {
    logs: sheetToObjects(ss.getSheetByName('DailyLogs')),
    scans: sheetToObjects(ss.getSheetByName('StarfitScans')),
    lifts: sheetToObjects(ss.getSheetByName('Lifts')),
    dexas: sheetToObjects(ss.getSheetByName('DexaScans')),
    settings: settingsToObject(ss.getSheetByName('Settings')),
    phases: sheetToObjects(ss.getSheetByName('Phases')),
    fetchedAt: new Date().toISOString(),
  };
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let v = row[i];
        // Normalize dates to YYYY-MM-DD if Date object
        if (v instanceof Date) {
          v = Utilities.formatDate(v, 'GMT', "yyyy-MM-dd");
        }
        obj[h] = v;
      });
      return obj;
    });
}

function settingsToObject(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < values.length; i++) {
    const [key, value] = values[i];
    if (key) {
      // Parse booleans
      if (value === 'TRUE' || value === true) result[key] = true;
      else if (value === 'FALSE' || value === false) result[key] = false;
      else result[key] = value;
    }
  }
  return result;
}

// ============================================================
// INITIALIZATION — Run once from Apps Script editor
// ============================================================

function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  const schemas = {
    'DailyLogs': ['date','calories','protein','carbs','fat','liftDone','liftVolume','sleep','alcohol','steps','creatine','notes','adherenceScore','updatedAt','activeCal'],
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
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
  });
  
  Logger.log('Sheets initialized');
}

function seedInitialData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const now = new Date().toISOString();
  
  // DEXA baseline
  ss.getSheetByName('DexaScans').appendRow([
    '2026-04-10', 222.8, 147.8, 69.0, 30.8, 1818, 0.62, 9.2, 21.5, 0.20, 6.25,
    'BodySpec Weston', 'Baseline scan', now
  ]);
  
  // Starfit history
  const scans = [
    ['2026-05-02', 225.2, 35.1, 146.2, 79.0, 65, 107.2, 15, 1786, 'Pre-crucero baseline'],
    ['2026-05-09', 224.4, 35.6, 144.5, 79.9, 64, 105.9, 15, 1789, 'Post-crucero dehydrated'],
    ['2026-05-10', 224.6, 35.5, 144.9, 79.7, 65, 106.2, 15, 1790, 'Recovery day'],
    ['2026-05-16', 224.8, 36.7, 142.3, 82.5, 62, 104.3, 16, 1761, 'Post-CKO2 sin creatina 7d'],
    ['2026-05-17', 223.4, 35.9, 143.2, 80.2, 63, 105.0, 15, 1772, 'Post-baño AM fasted · Baseline Fase 1'],
  ];
  scans.forEach(s => ss.getSheetByName('StarfitScans').appendRow([...s, now]));
  
  // Lifts
  const lifts = [
    ['2026-04-29', 'Dylon', 'Legs PR', 'Legs', 5240, 60, '', '', 'PR all-time piernas', 'pr'],
    ['2026-05-03', 'Dylon', 'Finish-Line Fri', 'Mixed', 2160, '', '', '', 'Crucero día 2', ''],
    ['2026-05-04', 'Josiah', 'Functional', 'Functional', 2130, '', '', '', 'Crucero día 3', ''],
    ['2026-05-06', 'Dylon', 'Legs', 'Legs', 4945, '', '', '', 'PR crucero 94% del all-time', 'pr'],
    ['2026-05-08', 'Dylon', 'Flex Friday', 'Upper', 1030, 68, 107, 419, 'Último día crucero', ''],
    ['2026-05-11', 'Dylon', '#33', 'Mixed', 1799, 107, 109, 665, 'Pre-vuelo LAX', ''],
    ['2026-05-13', 'Dylon', '#34 Glutes', 'Legs', 4390, 66, 114, 439, 'Hotel LAX RDL dolor lumbar set incompleto', 'injury'],
    ['2026-05-17', 'Dylon', '#35 Finish-Line Fri', 'Mixed', 2295, 79, 119, 549, 'Zone 2 dominante 46% · Post-CKO2 recovery', ''],
  ];
  lifts.forEach(l => ss.getSheetByName('Lifts').appendRow([...l, now]));
  
  // Phases
  const phases = [
    [1, 'Reset', '2026-05-18', '2026-06-14', 2400, 200, 240, 65, 2800, 'Restart post-CKO2'],
    [2, 'Cut Sostenido', '2026-06-15', '2026-07-31', 2300, 210, 220, 60, 2700, 'Pre-panel hormonal agosto'],
    [3, 'Carb Cycling', '2026-08-01', '2026-10-31', 2330, 200, 220, 60, 2700, 'Ciclado optimizar performance'],
    [4, 'Final Cut', '2026-11-01', '2027-02-28', 2100, 220, 180, 50, 2500, 'Déficit agresivo'],
    [5, 'Lean Phase', '2027-03-01', '2027-08-31', 2000, 220, 160, 50, 2400, 'Último tramo a 180 lbs 12% BF'],
  ];
  phases.forEach(p => ss.getSheetByName('Phases').appendRow(p));
  
  // Settings
  const settings = [
    ['travelMode', false],
    ['injuryActive', true],
    ['physioBooked', false],
    ['currentPhase', 1],
    ['nextDexaDate', '2026-07-10'],
    ['nextStarfitDate', '2026-05-23'],
  ];
  settings.forEach(s => ss.getSheetByName('Settings').appendRow([...s, now]));
  
  Logger.log('Initial data seeded');
}

// ============================================================
// MAINTENANCE
// ============================================================

function generateSecret() {
  // Run from editor to get a random 32-char secret
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  Logger.log('New secret: ' + secret);
  return secret;
}

function weeklyDigest() {
  // Trigger this Monday 7am via Apps Script trigger
  // TODO: send email summary of last week
}

function cleanupDuplicateDates() {
  // ONE-TIME cleanup: collapse DailyLogs to one row per date. saveLog upserts
  // by date, so duplicates should only exist from the May-31 backfill or a
  // pre-upsert era. For each date we KEEP the row with the latest `updatedAt`
  // (the merged/most-complete one) and delete the rest. Unlike a naive
  // clear()+re-append, this deletes rows in place — header row, frozen row,
  // and formatting are preserved, and "latest updatedAt wins" keeps the row
  // that accumulated the most merged fields rather than just the last appended.
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('DailyLogs');
  if (!sheet) throw new Error('DailyLogs sheet not found');

  const values = sheet.getDataRange().getValues();
  if (values.length < 3) {
    Logger.log('cleanupDuplicateDates: nothing to do (' + Math.max(values.length - 1, 0) + ' data rows)');
    return { original: Math.max(values.length - 1, 0), removed: 0, kept: Math.max(values.length - 1, 0) };
  }

  const headers = values[0];
  const dateCol = headers.indexOf('date');
  const updatedCol = headers.indexOf('updatedAt');
  if (dateCol < 0) throw new Error('DailyLogs missing `date` header');

  function dateKey(v) {
    if (v instanceof Date) return Utilities.formatDate(v, 'GMT', 'yyyy-MM-dd');
    return String(v || '').slice(0, 10);
  }

  // Best row per date: highest updatedAt, tie-break on the later sheet row.
  const best = {}; // date -> { row: 1-based, stamp: string }
  for (let i = 1; i < values.length; i++) {
    const key = dateKey(values[i][dateCol]);
    if (!key) continue;
    const stamp = updatedCol >= 0 ? String(values[i][updatedCol] || '') : '';
    const row = i + 1;
    const cur = best[key];
    if (!cur || stamp > cur.stamp || (stamp === cur.stamp && row > cur.row)) {
      best[key] = { row: row, stamp: stamp };
    }
  }

  const keepRows = {};
  Object.keys(best).forEach(function (k) { keepRows[best[k].row] = true; });

  const toDelete = [];
  for (let i = 1; i < values.length; i++) {
    const key = dateKey(values[i][dateCol]);
    const row = i + 1;
    if (!key) continue;        // leave truly-blank rows alone
    if (!keepRows[row]) toDelete.push(row);
  }

  // Bottom-up so row indices stay valid as we delete.
  for (let d = toDelete.length - 1; d >= 0; d--) {
    sheet.deleteRow(toDelete[d]);
  }

  const original = values.length - 1;
  const result = { original: original, removed: toDelete.length, kept: original - toDelete.length };
  Logger.log('cleanupDuplicateDates: ' + JSON.stringify(result) +
    (toDelete.length > 0 ? ' (duplicates found — expected)' : ' (no duplicates)'));
  return result;
}
