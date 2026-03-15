const fs = require('fs');
const { buildStats } = require('./stats');
const { DATA_PATH, CACHE_TTL_MS, WATCHER_DEBOUNCE_MS, WATCHER_RETRY_MS } = require('../constants');

const cache = {
  value: null,
  updatedAt: 0
};

let watcher;
let refreshStatsPromise = null;
let refreshTimer = null;

function isCacheFresh() {
  return cache.value !== null && Date.now() - cache.updatedAt < CACHE_TTL_MS;
}

async function readStatsFromFile() {
  const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
  return buildStats(JSON.parse(raw));
}

async function refreshStatsCache() {
  if (refreshStatsPromise) {
    return refreshStatsPromise;
  }

  refreshStatsPromise = readStatsFromFile()
    .then((stats) => {
      cache.value = stats;
      cache.updatedAt = Date.now();
      return stats;
    })
    .finally(() => {
      refreshStatsPromise = null;
    });

  return refreshStatsPromise;
}

function scheduleRefresh(delay = WATCHER_DEBOUNCE_MS) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  refreshTimer = setTimeout(async () => {
    refreshTimer = null;

    try {
      await refreshStatsCache();
    } catch (error) {
      if (cache.value !== null) {
        scheduleRefresh(WATCHER_RETRY_MS);
        return;
      }
      console.error('Stats cache refresh failed before a successful refresh:', error);
    }
  }, delay);
}

function ensureWatcher() {
  if (watcher) {
    return;
  }

  watcher = fs.watch(DATA_PATH, () => {
    scheduleRefresh();
  });

  watcher.on('error', (error) => {
    console.error('Stats file watcher error:', error);
  });
}

function closeWatcher() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

async function getStats() {
  ensureWatcher();

  if (isCacheFresh()) {
    return cache.value;
  }

  try {
    return await refreshStatsCache();
  } catch (error) {
    if (cache.value !== null) {
      return cache.value;
    }

    throw error;
  }
}

module.exports = {
  getStats,
  _internal: {
    cache,
    closeWatcher
  }
};