import { cache, cacheKeys } from '../cache/index.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

const occupancyPercent = (registered, capacity) => (capacity > 0 ? Math.round((registered / capacity) * 100) : 0);

function statusOf(event, registered, now) {
  if (registered >= event.capacity) return 'full';
  if (new Date(event.startsAt) < now) return 'past';
  return 'open';
}

export const statsService = {
  // "past" depends on the clock, so this answer can be at most one cache TTL out of date
  // when an event starts. Everything else is invalidated by the writes themselves.
  occupancy() {
    return cache.wrap(cacheKeys.stats, async () => {
      const [events, counts] = await Promise.all([eventRepository.listById(), registrationRepository.countsPerEvent()]);
      const now = new Date();

      return events.map((event) => {
        const registered = counts.get(event.id) ?? 0;
        return {
          id: event.id,
          title: event.title,
          registered,
          capacity: event.capacity,
          occupancy: `${occupancyPercent(registered, event.capacity)}%`,
          status: statusOf(event, registered, now)
        };
      });
    });
  }
};
