import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemoryCache } from '../../src/cache/memoryCache.mjs';

// Pure unit tests: no database, no HTTP. A fake clock makes expiry instant and exact.
function makeCache(options = {}) {
  const clock = { now: 1_000 };
  const cache = new MemoryCache({ ttlMs: 100, now: () => clock.now, ...options });
  return { cache, clock };
}

const countingLoader = (value = 'data') => {
  const loader = async () => {
    loader.calls += 1;
    return value;
  };
  loader.calls = 0;
  return loader;
};

describe('MemoryCache', () => {
  it('calls the loader once while the entry is fresh', async () => {
    const { cache } = makeCache();
    const loader = countingLoader();

    await cache.wrap('k', loader);
    const second = await cache.wrap('k', loader);

    assert.equal(second, 'data');
    assert.equal(loader.calls, 1);
    assert.deepEqual(cache.stats(), { hits: 1, misses: 1, size: 1 });
  });

  it('loads again after the TTL has passed', async () => {
    const { cache, clock } = makeCache();
    const loader = countingLoader();

    await cache.wrap('k', loader);
    clock.now += 101;
    await cache.wrap('k', loader);

    assert.equal(loader.calls, 2);
  });

  it('invalidate() removes only the given keys', async () => {
    const { cache } = makeCache();
    const a = countingLoader('a');
    const b = countingLoader('b');
    await cache.wrap('a', a);
    await cache.wrap('b', b);

    cache.invalidate(['a']);
    await cache.wrap('a', a);
    await cache.wrap('b', b);

    assert.equal(a.calls, 2);
    assert.equal(b.calls, 1);
  });

  it('does not store a result that was loaded before an invalidation', async () => {
    const { cache } = makeCache();
    let release;
    const slowLoader = () => new Promise((resolve) => { release = () => resolve('old'); });

    const pending = cache.wrap('k', slowLoader); // starts reading "old" data...
    cache.invalidate(['k']); // ...a write happens in the meantime...
    release(); // ...and only then does the slow read finish
    assert.equal(await pending, 'old'); // the caller still gets its answer

    const fresh = countingLoader('new');
    assert.equal(await cache.wrap('k', fresh), 'new'); // but "old" was not kept
    assert.equal(fresh.calls, 1);
  });

  it('does not cache a loader that throws', async () => {
    const { cache } = makeCache();
    await assert.rejects(cache.wrap('k', async () => { throw new Error('not found'); }), /not found/);

    const loader = countingLoader();
    await cache.wrap('k', loader);

    assert.equal(loader.calls, 1);
    assert.equal(cache.stats().size, 1);
  });

  it('always loads when disabled', async () => {
    const { cache } = makeCache({ enabled: false });
    const loader = countingLoader();

    await cache.wrap('k', loader);
    await cache.wrap('k', loader);

    assert.equal(loader.calls, 2);
  });

  it('drops the oldest entry when maxEntries is reached', async () => {
    const { cache } = makeCache({ maxEntries: 2 });
    const first = countingLoader('1');
    await cache.wrap('first', first);
    await cache.wrap('second', countingLoader('2'));
    await cache.wrap('third', countingLoader('3'));

    await cache.wrap('first', first);

    assert.equal(first.calls, 2);
    assert.equal(cache.stats().size, 2);
  });

  it('clear() empties everything', async () => {
    const { cache } = makeCache();
    await cache.wrap('k', countingLoader());

    cache.clear();

    assert.equal(cache.stats().size, 0);
  });
});
