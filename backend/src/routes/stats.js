const express = require('express');
const router = express.Router();
const { getStats } = require('../utils/statsCache');

// GET /api/stats
router.get('/', async (req, res, next) => {
 try {
  const stats = await getStats();
  res.json(stats);
 } catch (error) {
  next(error);
 }
});

module.exports = router;