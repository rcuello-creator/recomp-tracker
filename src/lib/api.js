// ============================================================
// API client for Google Apps Script Web App
// ============================================================

const API_URL = import.meta.env.VITE_API_URL;
const SECRET = import.meta.env.VITE_API_SECRET;

if (!API_URL || !SECRET) {
  console.warn('VITE_API_URL or VITE_API_SECRET not set. Sync disabled.');
}

async function post(action, data) {
  if (!API_URL) throw new Error('API not configured');
  
  const res = await fetch(API_URL, {
    method: 'POST',
    // Apps Script does not require CORS preflight for text/plain
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: SECRET, action, data }),
    redirect: 'follow',
  });
  
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function get() {
  if (!API_URL) throw new Error('API not configured');
  
  const url = `${API_URL}?secret=${encodeURIComponent(SECRET)}`;
  const res = await fetch(url, { redirect: 'follow' });
  
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export const api = {
  isConfigured: () => Boolean(API_URL && SECRET),
  saveLog: (data) => post('saveLog', data),
  saveScan: (data) => post('saveScan', data),
  saveLift: (data) => post('saveLift', data),
  saveDexa: (data) => post('saveDexa', data),
  updateSettings: (data) => post('updateSettings', data),
  syncBatch: (batch) => post('syncBatch', batch),
  getHistory: () => get(),
};
