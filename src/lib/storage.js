// ============================================================
// localStorage layer + offline sync queue
// ============================================================

const PREFIX = 'recomp:';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('storage.get failed', key, e);
      return fallback;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('storage.set failed', key, e);
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {}
  },
  
  // Sync queue: array of pending operations
  getQueue() {
    return this.get('syncQueue', []);
  },
  
  enqueue(action, data) {
    const queue = this.getQueue();
    queue.push({ id: Date.now() + Math.random(), action, data, attempts: 0 });
    this.set('syncQueue', queue);
  },
  
  clearQueue() {
    this.set('syncQueue', []);
  },
  
  removeFromQueue(id) {
    const queue = this.getQueue().filter(op => op.id !== id);
    this.set('syncQueue', queue);
  },
  
  // Last successful sync timestamp
  setLastSync(ts) {
    this.set('lastSync', ts);
  },
  
  getLastSync() {
    return this.get('lastSync', null);
  },
};
