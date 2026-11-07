// Business rules for events. No Express, no Sequelize. Reads go through the cache;
// every write tells the cache which answers it made outdated (see cache/keys.mjs).
import { cache, cacheKeys } from '../cache/index.mjs';
import { notFound } from '../errors/appError.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

const eventNotFound = (id) => notFound(`Event with id ${id} not found`);

export const eventService = {
  list() {
    return cache.wrap(cacheKeys.eventList, () => eventRepository.listByStart());
  },

  get(id) {
    return cache.wrap(cacheKeys.event(id), async () => {
      const event = await eventRepository.findById(id);
      if (!event) throw eventNotFound(id);

      const registered = await registrationRepository.countByEvent(id);
      return { ...event, registered, spotsLeft: Math.max(event.capacity - registered, 0) };
    });
  },

  async create(data) {
    const event = await eventRepository.create(data);
    cache.invalidate([cacheKeys.eventList, cacheKeys.stats]);
    return event;
  },

  async update(id, data) {
    const event = await eventRepository.update(id, data);
    if (!event) throw eventNotFound(id);

    cache.invalidate([cacheKeys.eventList, cacheKeys.event(id), cacheKeys.stats]);
    return event;
  },

  async remove(id) {
    const removed = await eventRepository.remove(id);
    if (!removed) throw eventNotFound(id);

    cache.invalidate([cacheKeys.eventList, cacheKeys.event(id), cacheKeys.registrations(id), cacheKeys.stats]);
  }
};
