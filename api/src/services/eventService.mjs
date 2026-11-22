// Business rules for events. No Express, no Sequelize. Reads go through the cache;
// every write tells the cache which answers it made outdated (see cache/keys.mjs).
import { cache, cacheKeys } from '../cache/index.mjs';
import { notFound } from '../errors/appError.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { notificationHub } from '../notifications/index.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

const eventNotFound = (id) => notFound(`Event with id ${id} not found`);

export const eventService = {
  list() {
    return cache.wrap(cacheKeys.eventList, () => eventRepository.listByStart());
  },

  // Filtered after the cached list, so an event counts as past the moment it starts (not one TTL later).
  // `now` is a parameter so a test can pick the moment.
  async listUpcoming(now = new Date()) {
    const events = await eventService.list();
    return events.filter((event) => new Date(event.startsAt) >= now);
  },

  async listPast(now = new Date()) {
    const events = await eventService.list();
    // filter() makes a new array, so reverse() never changes the cached list. Most recent first.
    return events.filter((event) => new Date(event.startsAt) < now).reverse();
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
    notificationHub.publish({ type: 'event-created', eventId: event.id, title: event.title });
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
