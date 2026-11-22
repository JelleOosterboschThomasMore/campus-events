import { app } from '../../src/app.mjs';
import { cache } from '../../src/cache/index.mjs';
import { sequelize } from '../../src/db/connection.mjs';
import { Event, MailJob, Registration } from '../../src/models/index.mjs';

// The app and its database are created as soon as app.mjs is imported.
// .env.test sets DB_STORAGE=:memory:, so the tests never touch your real data.
// Every call empties all tables and the cache: tests never share state.
export async function createTestApp() {
  await sequelize.sync({ force: true });
  cache.clear();
  return { app, db: { sequelize, Event, Registration, MailJob } };
}

export const validEvent = (overrides = {}) => ({
  title: 'Backend Bootcamp',
  location: 'Room C101',
  startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  capacity: 10,
  ...overrides
});
