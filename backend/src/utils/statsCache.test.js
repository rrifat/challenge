const { getStats, _internal } = require('./statsCache');

describe('statsCache', () => {
  afterAll(() => {
    _internal.closeWatcher();
  });

  beforeEach(() => {
    _internal.cache.value = null;
    _internal.cache.updatedAt = 0;
  });

  it('returns stats from getStats()', async () => {
    const stats = await getStats();
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.averagePrice).toBe('number');
  });

  it('serves from cache on second call (same object reference)', async () => {
    const first = await getStats();
    const second = await getStats();
    expect(first).toBe(second);
    expect(_internal.cache.value).toBe(first);
  });

  it('populates _internal.cache after first getStats()', async () => {
    expect(_internal.cache.value).toBeNull();
    await getStats();
    expect(_internal.cache.value).not.toBeNull();
    expect(_internal.cache.updatedAt).toBeGreaterThan(0);
  });
});
