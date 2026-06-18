const path = require('path');
const fs = require('fs');

class LocalStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.cacheFile = path.join(baseDir, 'api-cache.json');
    this.queueFile = path.join(baseDir, 'sync-queue.json');
    this.metaFile = path.join(baseDir, 'metadata.json');
    this.cache = this._readJSON(this.cacheFile, {});
    this.queue = this._readJSON(this.queueFile, []);
    this.meta = this._readJSON(this.metaFile, { lastSync: null, online: true });
  }

  _readJSON(file, fallback) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch (_) {}
    return fallback;
  }

  _writeJSON(file, data) {
    try {
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (_) {}
  }

  _saveCache() {
    this._writeJSON(this.cacheFile, this.cache);
  }

  _saveQueue() {
    this._writeJSON(this.queueFile, this.queue);
  }

  _saveMeta() {
    this._writeJSON(this.metaFile, this.meta);
  }

  getCache(key) {
    const entry = this.cache[key];
    if (!entry) return null;
    return entry.data;
  }

  setCache(key, data) {
    this.cache[key] = { data, cachedAt: Date.now() };
    this._saveCache();
  }

  invalidateCache(pattern) {
    const keys = Object.keys(this.cache);
    for (const key of keys) {
      if (key.includes(pattern)) {
        delete this.cache[key];
      }
    }
    this._saveCache();
  }

  clearAllCache() {
    this.cache = {};
    this._saveCache();
  }

  addToQueue(method, url, headers, body) {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      method,
      url,
      headers,
      body,
      createdAt: Date.now(),
      retries: 0
    };
    this.queue.push(item);
    this._saveQueue();
    return item;
  }

  removeFromQueue(id) {
    this.queue = this.queue.filter(q => q.id !== id);
    this._saveQueue();
  }

  getQueue() {
    return this.queue;
  }

  setOnline(online) {
    this.meta.online = online;
    this._saveMeta();
  }

  isOnline() {
    return this.meta.online;
  }

  setLastSync(time) {
    this.meta.lastSync = time;
    this._saveMeta();
  }

  getLastSync() {
    return this.meta.lastSync;
  }

  getStats() {
    return {
      cachedEntries: Object.keys(this.cache).length,
      pendingQueue: this.queue.length,
      lastSync: this.meta.lastSync,
      online: this.meta.online
    };
  }
}

module.exports = { LocalStore };
