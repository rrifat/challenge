const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/items.json');
const CACHE_TTL_MS = 30 * 1000;
const WATCHER_DEBOUNCE_MS = 150;
const WATCHER_RETRY_MS = 500;

module.exports = {
  DATA_PATH,
  CACHE_TTL_MS,
  WATCHER_DEBOUNCE_MS,
  WATCHER_RETRY_MS
};