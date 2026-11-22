import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { notificationHub } from '../../src/notifications/index.mjs';
import { createTestApp, validEvent } from '../helpers/testApp.mjs';

// A real server on a free port: the stream stays open, so it is read the way a browser reads it.
describe('GET /api/notifications (server-sent events)', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    ({ app } = await createTestApp());
    server = app.listen(0);
    await once(server, 'listening');
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  // Reads from the stream until one complete "data:" message has arrived.
  async function nextMessage(reader) {
    let text = '';
    while (!/data: .*\n\n/.test(text)) {
      const { value, done } = await reader.read();
      if (done) throw new Error('stream ended before a message arrived');
      text += value;
    }
    return JSON.parse(text.match(/data: (.*)\n\n/)[1]);
  }

  async function waitUntil(condition) {
    for (let i = 0; i < 50 && !condition(); i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  }

  it('sends a new event to a connected browser, then forgets the browser when it disconnects', async () => {
    const connection = new AbortController();
    const res = await fetch(`${baseUrl}/api/notifications`, { signal: connection.signal });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^text\/event-stream/);
    assert.equal(notificationHub.listenerCount(), 1);

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    const created = await request(app).post('/api/events').send(validEvent({ title: 'Backend Bootcamp' }));

    assert.deepEqual(await nextMessage(reader), {
      type: 'event-created',
      eventId: created.body.id,
      title: 'Backend Bootcamp'
    });

    connection.abort();
    await waitUntil(() => notificationHub.listenerCount() === 0);
    assert.equal(notificationHub.listenerCount(), 0);
  });
});
