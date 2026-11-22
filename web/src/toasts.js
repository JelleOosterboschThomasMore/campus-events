// The toasts currently on screen, shared by the whole app (one reactive list, no store library needed).
import { reactive } from 'vue';

export const toasts = reactive([]);
let nextId = 1;

export function showToast(text, { durationMs = 6000 } = {}) {
  const id = nextId++;
  toasts.push({ id, text });
  setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) toasts.splice(index, 1);
}

// The text for a server notification. It only ever uses the event title: the API never sends
// who registered, and the toast could not show it even if it did.
export function toastText(notification) {
  if (notification.type === 'event-created') return `New event: ${notification.title}`;
  if (notification.type === 'registration-created') return `Someone just registered for ${notification.title}`;
  return null; // unknown type, e.g. from a newer API: show nothing rather than something wrong
}
