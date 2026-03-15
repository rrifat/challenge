const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
  const raw = await fs.promises.readFile(DATA_PATH);
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, q } = req.query;
    let results = data;

    if (q) {
      // Simple substring search (sub‑optimal)
      results = results.filter(item => item.name.toLowerCase().includes(q.toLowerCase()));
    }

    if (limit) {
      results = results.slice(0, parseInt(limit));
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      const err = new Error('Invalid item id');
      err.status = 400;
      throw err;
    }
    const data = await readData();
    const item = data.find(i => i.id === id);
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const item = req.body;
    if (!item.name || !item.category || !item.price) {
      const err = new Error('Invalid item payload');
      err.status = 400;
      throw err;
    }

    if (typeof item.price !== 'number') {
      const err = new Error('Invalid item price');
      err.status = 400;
      throw err;
    }
    if (typeof item.category !== 'string') {
      const err = new Error('Invalid item category');
      err.status = 400;
      throw err;
    }
    if (typeof item.name !== 'string') {
      const err = new Error('Invalid item name');
      err.status = 400;
      throw err;
    }
    if (item.price <= 0) {
      const err = new Error('Invalid item price');
      err.status = 400;
      throw err;
    }

    if (item.category.length === 0 || item.name.length === 0) {
      const err = new Error('Invalid item category or name');
      err.status = 400;
      throw err;
    }

    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.promises.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;