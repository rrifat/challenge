const fs = require('fs');
const { DATA_PATH } = require('../constants');

async function readData() {
    const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  }
  
function parsePositiveInteger(value, fallback, fieldName) {
    if (value === undefined) {
      return fallback;
    }
  
    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      const err = new Error(`Invalid ${fieldName}`);
      err.status = 400;
      throw err;
    }
  
    return parsedValue;
}

module.exports = { readData, parsePositiveInteger }