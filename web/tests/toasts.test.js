import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, showToast, toastText, toasts } from '../src/toasts.js';

describe('toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    toasts.splice(0); // empty the shared list between tests
    vi.useRealTimers();
  });

  it('turns a notification into a text with the event title', () => {
    expect(toastText({ type: 'event-created', eventId: 1, title: 'Backend Bootcamp' })).toBe('New event: Backend Bootcamp');
    expect(toastText({ type: 'registration-created', eventId: 1, title: 'Backend Bootcamp' })).toBe(
      'Someone just registered for Backend Bootcamp'
    );
  });

  it('never shows who registered, even if a name were sent', () => {
    const text = toastText({ type: 'registration-created', title: 'Backend Bootcamp', name: 'Ada', email: 'ada@example.com' });

    expect(text).not.toMatch(/Ada|ada@example\.com/);
  });

  it('shows nothing for an unknown notification type', () => {
    expect(toastText({ type: 'something-new', title: 'X' })).toBeNull();
  });

  it('shows one toast per call and removes it after a while', () => {
    showToast('New event: Backend Bootcamp', { durationMs: 1000 });
    expect(toasts.map((toast) => toast.text)).toEqual(['New event: Backend Bootcamp']);

    vi.advanceTimersByTime(1000);
    expect(toasts).toHaveLength(0);
  });

  it('can be dismissed before the time is up', () => {
    showToast('New event: Backend Bootcamp');

    dismissToast(toasts[0].id);

    expect(toasts).toHaveLength(0);
  });
});
