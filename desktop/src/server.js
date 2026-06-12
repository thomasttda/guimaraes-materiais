const express = require('express');
const path = require('path');
const http = require('http');
const { app: electronApp } = require('electron');
const { LocalStore } = require('./store');

const API_BASE = 'https://guimaraes-materiais.vercel.app';
const SYNC_INTERVAL = 30000;
const PORT_RANGE = { start: 3005, end: 3099 };

function getFrontendPath() {
  if (electronApp.isPackaged) {
    return path.join(process.resourcesPath, 'frontend-dist');
  }
  return path.join(__dirname, '..', '..', 'frontend', 'dist');
}

function getDataPath() {
  if (electronApp.isPackaged) {
    return path.join(electronApp.getPath('userData'), 'backup');
  }
  return path.join(__dirname, '..', '..', 'desktop-data', 'backup');
}

function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

async function startServer() {
  const store = new LocalStore(getDataPath());
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    addCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const frontendPath = getFrontendPath();
  app.use(express.static(frontendPath));

  app.use('/api', async (req, res) => {
    const targetUrl = `${API_BASE}${req.originalUrl}`;
    const method = req.method.toUpperCase();

    const filteredHeaders = { ...req.headers };
    delete filteredHeaders.host;
    delete filteredHeaders.connection;
    delete filteredHeaders['content-length'];

    const fetchOptions = { method, headers: filteredHeaders };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const headers = { 'Content-Type': 'application/json' };
      if (filteredHeaders.authorization) headers.authorization = filteredHeaders.authorization;
      const fetchOptions = { method, headers };

      if (req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const queueItem = store.addToQueue(method, req.originalUrl, filteredHeaders, req.body);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(targetUrl, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeout);
        const data = await response.json();

        store.removeFromQueue(queueItem.id);
        store.invalidateCache(req.originalUrl);
        store.setOnline(true);
        store.setLastSync(Date.now());

        return res.status(response.status).json(data);
      } catch (err) {
        store.setOnline(false);
        return res.json({
          _offline: true,
          _queued: true,
          _message: 'Operação salva localmente. Será sincronizada quando a internet voltar.',
          _id: queueItem.id
        });
      }
    }

    if (method === 'GET') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(targetUrl, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          store.setCache(req.originalUrl, data);
          store.setOnline(true);
          store.setLastSync(Date.now());
          return res.json(data);
        }

        const cached = store.getCache(req.originalUrl);
        if (cached) return res.json(cached);
        store.setOnline(false);
        return res.status(response.status).json({ error: 'Erro do servidor' });
      } catch (err) {
        store.setOnline(false);
        const cached = store.getCache(req.originalUrl);
        if (cached) {
          res.setHeader('X-Offline-Cache', 'true');
          return res.json(cached);
        }
        return res.status(503).json({
          error: 'Sem internet e sem cache local disponível',
          _offline: true
        });
      }
    }

    try {
      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.json();
      store.setOnline(true);
      return res.status(response.status).json(data);
    } catch (err) {
      store.setOnline(false);
      return res.status(503).json({ error: 'Sem conexão com o servidor', _offline: true });
    }
  });

  app.get('/_offline/status', (req, res) => {
    res.json(store.getStats());
  });

  app.post('/_offline/retry-queue', async (req, res) => {
    const results = await processSyncQueue(store);
    res.json(results);
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    let port = PORT_RANGE.start;

    const tryListen = () => {
      server.listen(port, '127.0.0.1', () => {
        console.log(`Servidor local rodando em http://127.0.0.1:${port}`);
        startSyncEngine(store);
        resolve(port);
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          port++;
          if (port > PORT_RANGE.end) {
            reject(new Error('Nenhuma porta disponível'));
          } else {
            tryListen();
          }
        } else {
          reject(err);
        }
      });
    };

    tryListen();
  });
}

function startSyncEngine(store) {
  setInterval(() => processSyncQueue(store), SYNC_INTERVAL);

  electronApp.on('before-quit', () => {
    clearInterval(this._syncInterval);
  });
}

async function processSyncQueue(store) {
  const queue = store.getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  console.log(`[Sync] Processando ${queue.length} itens pendentes...`);
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const targetUrl = `${API_BASE}${item.url}`;

      const headers = { ...item.headers };
      if (item.body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(targetUrl, {
        method: item.method,
        headers,
        body: item.body ? JSON.stringify(item.body) : undefined
      });

      if (response.ok) {
        store.removeFromQueue(item.id);
        store.invalidateCache(item.url);
        synced++;
        console.log(`[Sync] OK: ${item.method} ${item.url}`);
      } else {
        item.retries = (item.retries || 0) + 1;
        if (item.retries >= 10) {
          store.removeFromQueue(item.id);
          console.log(`[Sync] Descartado (10 tentativas): ${item.method} ${item.url}`);
        }
        failed++;
      }
    } catch (err) {
      store.setOnline(false);
      failed++;
      console.log(`[Sync] Falha: ${item.method} ${item.url} - ${err.message}`);
      break;
    }
  }

  if (synced > 0) {
    store.setOnline(true);
    store.setLastSync(Date.now());
  }

  return { synced, failed };
}

module.exports = { startServer };
