/**
 * Decoupled Pub/Sub EventBus
 * Coordinates communication across isolated subsystems without tight coupling.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe once to an event
   */
  once(event, callback) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(callback);
    if (this.listeners.get(event).size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Publish an event to all subscribers
   */
  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    for (const callback of this.listeners.get(event)) {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
