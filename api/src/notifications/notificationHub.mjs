// Services announce what happened here; whoever is interested subscribes when they open the browser.
export class NotificationHub {
  #listeners = new Set();

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  publish(notification) {
    for (const listener of this.#listeners) {
      listener(notification);
    }
  }

  listenerCount() {
    return this.#listeners.size;
  }
}