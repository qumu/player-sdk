export type FunctionOrPromise = Function | {
  reject: Function;
  resolve: Function;
};

export class CallbackStore {
  private readonly map = new Map();

  /**
   * Gets all the callbacks for a specific event name
   *
   * @param name the event name we want the callbacks from
   */
  getCallbacks(name: string): Function[] | FunctionOrPromise[] {
    return this.map.get(name) || [];
  }

  /**
   * Removes the given callback for the event
   *
   * @param name the event name we want the callbacks from
   * @param callback the callback to remove. If empty, it will remove all callbacks
   */
  removeCallback(name: string, callback?: FunctionOrPromise): void {
    const callbacks = this.map.get(name) || [];

    if (!callbacks) {
      return;
    }

    // If no callback is passed, remove all callbacks for the event
    if (!callback) {
      this.map.delete(name);

      return;
    }

    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this.map.delete(name);
    } else {
      this.map.set(name, callbacks);
    }
  }

  /**
   * Removes and return the first callback for the name
   *
   * @param name the event name we want the callbacks from
   */
  shiftCallback(name: string): FunctionOrPromise | undefined {
    const callbacks = this.getCallbacks(name);

    if (callbacks.length === 0) {
      return undefined;
    }

    const callback = callbacks.shift();

    this.removeCallback(name, callback);

    return callback;
  }

  /**
   * Stores the callback for the event
   *
   * @param name the event name we want the callbacks from
   * @param callback the callback to store
   */
  storeCallback(name: string, callback: FunctionOrPromise): void {
    const callbacks = this.map.get(name) || [];

    callbacks.push(callback);

    this.map.set(name, callbacks);
  }
}
