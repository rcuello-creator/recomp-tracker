import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import { storage } from './storage';
import { STARFIT_SEED, LIFTS_SEED, SETTINGS_DEFAULT } from '../data/seed';

const SYNC_INTERVAL_MS = 30_000;

export function useStorageSync() {
  const [logs, setLogs] = useState(() => storage.get('logs', {}));
  const [scans, setScans] = useState(() => storage.get('scans', STARFIT_SEED));
  const [lifts, setLifts] = useState(() => storage.get('lifts', LIFTS_SEED));
  const [dexas, setDexas] = useState(() => storage.get('dexas', []));
  const [settings, setSettings] = useState(() => storage.get('settings', SETTINGS_DEFAULT));
  
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(() => storage.getLastSync());
  const [queueLen, setQueueLen] = useState(() => storage.getQueue().length);
  
  const syncing = useRef(false);
  
  useEffect(() => { storage.set('logs', logs); }, [logs]);
  useEffect(() => { storage.set('scans', scans); }, [scans]);
  useEffect(() => { storage.set('lifts', lifts); }, [lifts]);
  useEffect(() => { storage.set('dexas', dexas); }, [dexas]);
  useEffect(() => { storage.set('settings', settings); }, [settings]);
  
  const fetchFromServer = useCallback(async () => {
    if (!api.isConfigured()) {
      setSyncStatus('offline');
      return;
    }
    try {
      setSyncStatus('syncing');
      const data = await api.getHistory();
      if (data.logs && data.logs.length) {
        const logsObj = {};
        data.logs.forEach(l => { logsObj[l.date] = l; });
        setLogs(logsObj);
      }
      if (data.scans && data.scans.length) setScans(data.scans);
      if (data.lifts && data.lifts.length) setLifts(data.lifts);
      if (data.dexas && data.dexas.length) setDexas(data.dexas);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      const now = new Date().toISOString();
      storage.setLastSync(now);
      setLastSync(now);
      setSyncStatus('idle');
    } catch (e) {
      console.error('Initial fetch failed', e);
      setSyncStatus('error');
    }
  }, []);
  
  const processSyncQueue = useCallback(async () => {
    if (syncing.current) return;
    if (!navigator.onLine) { setSyncStatus('offline'); return; }
    if (!api.isConfigured()) { setSyncStatus('offline'); return; }
    const queue = storage.getQueue();
    if (queue.length === 0) return;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      await api.syncBatch(queue);
      storage.clearQueue();
      setQueueLen(0);
      const now = new Date().toISOString();
      storage.setLastSync(now);
      setLastSync(now);
      setSyncStatus('idle');
    } catch (e) {
      console.error('Sync batch failed', e);
      setSyncStatus('error');
    } finally {
      syncing.current = false;
    }
  }, []);
  
  useEffect(() => {
    fetchFromServer();
    const interval = setInterval(processSyncQueue, SYNC_INTERVAL_MS);
    const handleOnline = () => processSyncQueue();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') processSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setSyncStatus('offline'));
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFromServer, processSyncQueue]);
  
  const enqueue = (action, data) => {
    storage.enqueue(action, data);
    setQueueLen(storage.getQueue().length);
    processSyncQueue();
  };
  
  const saveLog = (date, data) => {
    const log = { ...data, date };
    setLogs(prev => ({ ...prev, [date]: log }));
    enqueue('saveLog', log);
  };
  
  const saveScan = (scan) => {
    setScans(prev => [...prev, scan].sort((a, b) => a.date.localeCompare(b.date)));
    enqueue('saveScan', scan);
  };
  
  const saveLift = (lift) => {
    setLifts(prev => [...prev, lift].sort((a, b) => a.date.localeCompare(b.date)));
    enqueue('saveLift', lift);
  };
  
  const saveDexa = (dexa) => {
    setDexas(prev => [...prev, dexa].sort((a, b) => a.date.localeCompare(b.date)));
    enqueue('saveDexa', dexa);
  };
  
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    enqueue('updateSettings', { [key]: value });
  };
  
  const forceSync = () => {
    fetchFromServer().then(processSyncQueue);
  };
  
  return {
    logs, scans, lifts, dexas, settings,
    saveLog, saveScan, saveLift, saveDexa, updateSetting,
    syncStatus, lastSync, queueLen, forceSync,
  };
}
