// Business rules for registrations: unknown event, duplicate email, full event.
import { cache, cacheKeys } from '../cache/index.mjs';
import { logger } from '../config/logger.mjs';
import { conflict, notFound } from '../errors/appError.mjs';
import { buildConfirmationMail, mailDispatcher } from '../mail/index.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

const eventNotFound = (id) => notFound(`Event with id ${id} not found`);

async function requireEvent(eventId) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw eventNotFound(eventId);
  return event;
}

async function assertCanRegister(event, email) {
  if (await registrationRepository.findByEventAndEmail(event.id, email)) {
    throw conflict(`${email} is already registered for this event`);
  }
  // Same rule as before the refactoring (`>`, so one extra person fits). Kept on purpose: a
  // refactoring must not change behaviour. Probably meant `>=`; that is a separate fix with its own test.
  if ((await registrationRepository.countByEvent(event.id)) > event.capacity) {
    throw conflict('Event is full');
  }
}

export const registrationService = {
  list(eventId) {
    return cache.wrap(cacheKeys.registrations(eventId), async () => {
      await requireEvent(eventId);
      return registrationRepository.listByEvent(eventId);
    });
  },

  async register(eventId, { name, email }) {
    const event = await requireEvent(eventId);
    await assertCanRegister(event, email);

    // Registration + mail job are stored together. Whatever happens to the mail provider
    // from here on, the registration is safe.
    const registration = await registrationRepository.createWithMailJob(
      { eventId, name, email },
      buildConfirmationMail(event, { name, email })
    );
    logger.info('new registration', { event: event.title, name, email });

    cache.invalidate([cacheKeys.event(eventId), cacheKeys.registrations(eventId), cacheKeys.stats]);
    mailDispatcher.kick(); // sends in the background; the response does not wait for it
    return registration;
  }
};
