import { config } from '../config/env.mjs';
import { MemoryCache } from './memoryCache.mjs';

// One cache for the whole process. Fine for a single instance; with several instances
// you would need a shared cache (Redis), because each process would otherwise keep its own copy.
export const cache = new MemoryCache({
  ttlMs: config.cache.ttlSeconds * 1000,
  maxEntries: config.cache.maxEntries,
  enabled: config.cache.enabled
});

export { cacheKeys } from './keys.mjs';
