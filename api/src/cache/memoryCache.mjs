// Small in-process cache with a time-to-live (TTL).
//
// Why a "generation" counter: a slow GET can read the database, then a write happens and
// invalidates the cache, and only then does the GET store its (now outdated) answer.
// Every invalidation bumps the generation; a loader that started in an older generation
// is not allowed to store its result. That is what keeps the cache correct under concurrency.
//
// The methods (wrap, invalidate, clear) are all the services use, so a Redis version
// can replace this class later without touching the services.
export class MemoryCache {
  #entries = new Map();
  #generation = 0;
  #hits = 0;
  #misses = 0;
  #ttlMs;
  #maxEntries;
  #enabled;
  #now;

  constructor({ ttlMs, maxEntries = 500, enabled = true, now = () => Date.now() }) {
    this.#ttlMs = ttlMs;
    this.#maxEntries = maxEntries;
    this.#enabled = enabled && ttlMs > 0;
    this.#now = now;
  }

  // Returns the cached value, or calls `loader`, stores its result and returns it.
  // If the loader throws (for example a 404), nothing is stored.
  async wrap(key, loader) {
    if (!this.#enabled) return loader();

    const entry = this.#lookup(key);
    if (entry) {
      this.#hits += 1;
      return entry.value;
    }

    this.#misses += 1;
    const generationAtStart = this.#generation;
    const value = await loader();
    if (generationAtStart === this.#generation) this.#store(key, value);
    return value;
  }

  // Call after every successful write, with the keys the write made outdated.
  invalidate(keys) {
    for (const key of keys) this.#entries.delete(key);
    this.#generation += 1;
  }

  clear() {
    this.#entries.clear();
    this.#generation += 1;
  }

  stats() {
    return { hits: this.#hits, misses: this.#misses, size: this.#entries.size };
  }

  #lookup(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry;
  }

  #store(key, value) {
    this.#entries.delete(key); // re-inserting moves the key to the "newest" end of the Map
    if (this.#entries.size >= this.#maxEntries) {
      this.#entries.delete(this.#entries.keys().next().value); // drop the oldest entry
    }
    this.#entries.set(key, { value, expiresAt: this.#now() + this.#ttlMs });
  }
}
