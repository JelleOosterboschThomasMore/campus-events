import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { notificationHub } from '../../src/notifications/index.mjs';
import { createTestApp, validEvent } from '../helpers/testApp.mjs';

// The requirement: every open browser hears about new events and registrations,
// exactly once per action, never learns who registered.
describe('notifications', () => {
    let app;
    let received;
    let unsubscribe;

    const createEvent = (title = 'Backend Bootcamp') =>
        request(app).post('/api/events').send(validEvent({ title }));
    const register = (eventId) =>
        request(app).post(`/api/events/${eventId}/registrations`).send({ name: 'Ada', email: 'ada@example.com' });

    beforeEach(async () => {
        ({ app } = await createTestApp());
        received = [];
        unsubscribe = notificationHub.subscribe((notification) => received.push(notification));
    });

    // The hub is shared by all tests, without this, listeners from earlier tests would pile up.
    afterEach(() => unsubscribe());

    it('announces a new event once', async () => {
        const res = await createEvent('Backend Bootcamp');

        assert.deepEqual(received, [{ type: 'event-created', eventId: res.body.id, title: 'Backend Bootcamp' }]);
    });

    it('announces a registration once, without the name or email', async () => {
        const event = await createEvent('Backend Bootcamp');
        received = []; // forget the event-created notification, only look at the registration

        await register(event.body.id);

        assert.deepEqual(received, [{ type: 'registration-created', eventId: event.body.id, title: 'Backend Bootcamp' }]);
        assert.doesNotMatch(JSON.stringify(received), /Ada|ada@example\.com/);
    });

    it('announces nothing when a registration is rejected', async () => {
        const event = await createEvent();
        await register(event.body.id);
        received = [];

        const duplicate = await register(event.body.id);

        assert.equal(duplicate.status, 409);
        assert.deepEqual(received, []);
    });
});