import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { cache } from '../../src/cache/index.mjs';
import { createTestApp, validEvent } from '../helpers/testApp.mjs';

// Two things to prove: a repeated GET is served from the cache,
// and after every kind of write the next GET shows the new data.
describe('GET caching', () => {
  let app;

  const createEvent = (overrides) => request(app).post('/api/events').send(validEvent(overrides));
  const register = (id, email = 'ada@example.com') =>
    request(app).post(`/api/events/${id}/registrations`).send({ name: 'Ada', email });

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  it('serves a repeated GET from the cache', async () => {
    await createEvent();
    const before = cache.stats();

    const first = await request(app).get('/api/events');
    const second = await request(app).get('/api/events');
    const after = cache.stats();

    assert.deepEqual(second.body, first.body);
    assert.equal(after.misses - before.misses, 1);
    assert.equal(after.hits - before.hits, 1);
  });

  it('shows a new event in the list right after it is created', async () => {
    await createEvent({ title: 'First one' });
    await request(app).get('/api/events'); // fills the cache

    await createEvent({ title: 'Second one' });
    const res = await request(app).get('/api/events');

    assert.equal(res.body.length, 2);
  });

  it('shows updated fields in the list and in the detail right after a PATCH', async () => {
    const { body } = await createEvent({ capacity: 5 });
    await request(app).get('/api/events');
    await request(app).get(`/api/events/${body.id}`);

    await request(app).patch(`/api/events/${body.id}`).send({ capacity: 50, title: 'Renamed event' });

    const list = await request(app).get('/api/events');
    const detail = await request(app).get(`/api/events/${body.id}`);
    assert.equal(list.body[0].title, 'Renamed event');
    assert.equal(detail.body.capacity, 50);
    assert.equal(detail.body.spotsLeft, 50);
  });

  it('returns 404 for a deleted event and drops it from list, registrations and stats', async () => {
    const { body } = await createEvent();
    await register(body.id);
    await request(app).get('/api/events');
    await request(app).get(`/api/events/${body.id}`);
    await request(app).get(`/api/events/${body.id}/registrations`);
    await request(app).get('/api/stats');

    await request(app).delete(`/api/events/${body.id}`);

    assert.deepEqual((await request(app).get('/api/events')).body, []);
    assert.equal((await request(app).get(`/api/events/${body.id}`)).status, 404);
    assert.equal((await request(app).get(`/api/events/${body.id}/registrations`)).status, 404);
    assert.deepEqual((await request(app).get('/api/stats')).body, []);
  });

  it('updates spotsLeft, the registrations list and the stats after a registration', async () => {
    const { body } = await createEvent({ capacity: 4 });
    await request(app).get(`/api/events/${body.id}`);
    await request(app).get(`/api/events/${body.id}/registrations`);
    await request(app).get('/api/stats');

    await register(body.id);

    const detail = await request(app).get(`/api/events/${body.id}`);
    const registrations = await request(app).get(`/api/events/${body.id}/registrations`);
    const stats = await request(app).get('/api/stats');
    assert.equal(detail.body.spotsLeft, 3);
    assert.equal(registrations.body.length, 1);
    assert.equal(stats.body[0].registered, 1);
    assert.equal(stats.body[0].occupancy, '25%');
  });

  it('does not cache errors: a 404 turns into 200 once the event exists', async () => {
    const missing = await request(app).get('/api/events/1');
    await createEvent();
    const found = await request(app).get('/api/events/1');

    assert.equal(missing.status, 404);
    assert.equal(found.status, 200);
  });
});
