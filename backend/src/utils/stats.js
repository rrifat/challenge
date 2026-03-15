function mean(arr) {
  if (arr.length === 0) {
    return 0;
  }
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function buildStats(items) {
  return {
    total: items.length,
    averagePrice: parseFloat(mean(items.map(item => item.price)).toFixed(2))
  };
}
module.exports = { mean, buildStats };