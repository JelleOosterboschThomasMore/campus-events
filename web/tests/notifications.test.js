import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribeToNotifications } from '../src/api/notifications.js';

// A stand-in for the browser's EventSource, so the test controls when a message "arrives".
class FakeEventSource {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.closed = false;
    FakeEventSource.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}

describe('subscribeToNotifications', () => {
  afterEach(() => {
    FakeEventSource.instances = [];
    vi.unstubAllGlobals();
  });

  it('opens one connection to /api/notifications and passes on each parsed message', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const received = [];

    subscribeToNotifications((notification) => received.push(notification));
    const [source] = FakeEventSource.instances;
    source.onmessage({ data: JSON.stringify({ type: 'event-created', eventId: 1, title: 'Backend Bootcamp' }) });

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(source.url).toBe('/api/notifications');
    expect(received).toEqual([{ type: 'event-created', eventId: 1, title: 'Backend Bootcamp' }]);
  });

  it('closes the connection when unsubscribed', () => {
    vi.stubGlobal('EventSource', FakeEventSource);

    const unsubscribe = subscribeToNotifications(() => {});
    unsubscribe();

    expect(FakeEventSource.instances[0].closed).toBe(true);
  });
});
