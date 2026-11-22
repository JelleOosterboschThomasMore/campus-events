import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotificationHub } from '../../src/notifications/notificationHub.mjs';

// Pure unit tests: no database, no HTTP. Every test makes its own hub, so tests never share listeners.
describe('NotificationHub', () => {
  it('delivers a published notification to every subscriber', () => {
    const hub = new NotificationHub();
    const receivedByA = [];
    const receivedByB = [];
    hub.subscribe((notification) => receivedByA.push(notification));
    hub.subscribe((notification) => receivedByB.push(notification));

    hub.publish({ type: 'event-created', eventId: 1 });

    assert.deepEqual(receivedByA, [{ type: 'event-created', eventId: 1 }]);
    assert.deepEqual(receivedByB, [{ type: 'event-created', eventId: 1 }]);
  });

  it('does not fail when nobody is subscribed', () => {
    const hub = new NotificationHub();

    assert.doesNotThrow(() => hub.publish({ type: 'event-created', eventId: 1 }));
  });

  it('stops delivering to a listener after it unsubscribes', () => {
    const hub = new NotificationHub();
    const received = [];
    const unsubscribe = hub.subscribe((notification) => received.push(notification));

    unsubscribe();
    hub.publish({ type: 'event-created', eventId: 1 });

    assert.deepEqual(received, []);
    assert.equal(hub.listenerCount(), 0);
  });
});
