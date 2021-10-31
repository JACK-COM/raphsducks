const noOp = () => {};

/**
 * A representation of an Application state.`ApplicationStore` is the state instance that
 * turns each key in its constructor args into a method from updating that state property.
 * (e.g. `state.users` = ApplicationStore.users( ... ))
 */
class _ApplicationStore {
  [x: string]: any;

  /** Subscribers/Listeners that are called when the state changes */
  subscribers: ListenerFn[] = [];

  /** @private Copy of original state args */
  private ref: ApplicationState | null = null;

  /** Instance state that gets updated. */
  private state: ApplicationState = {};

  constructor(state: ApplicationState) {
    /* State requires at least one key */
    if (Object.keys(state).length < 1) {
      const msg = "'state' needs to be an object with at least one key";
      throw new Error(msg);
    }

    // Initialize application source-of-truth
    this.state = { ...state };
    this.ref = Object.freeze(state);

    // Turn every key in the `state` representation into a method on the instance.
    for (let key in state) {
      const updater: StoreUpdaterFn = (value: any = null): void => {
        const updated = { ...this.state, [key]: value };
        return this.updateState(updated, [key]);
      };

      // (this as any)[key] = updater;
      (this as Store)[key] = updater as StoreUpdaterFn;
    }
  }

  /** Get [a copy of] the current application state */
  getState() {
    return Object.assign({}, { ...this.state });
  }

  /**
   * Update multiple keys in state before notifying subscribers.
   * @param {Partial<ApplicationState>} changes Data source for state updates. This
   * is an object with one or more state keys that need to be updated.
   */
  multiple(changes: Partial<ApplicationState>): void {
    if (typeof changes !== "object") {
      throw new Error("State updates need to be a key-value object literal");
    }

    const changeKeys: string[] = Object.keys(changes);
    let updated = { ...this.state };

    changeKeys.forEach((key) => {
      if (!(this as any)[key]) {
        throw new Error(`There is no "${key}" in this state instance.`);
      } else {
        updated = { ...updated, [key]: changes[key] };
      }
    });

    return this.updateState(updated, changeKeys);
  }

  /** Reset the instance to its initialized state. Preserve subscribers. */
  reset(clearSubscribers = false) {
    if (clearSubscribers) this.subscribers = [];
    // reset state to initial values
    this.multiple({ ...this.ref });
  }

  /**
   * Subscribe to the state instance. Returns an `unsubscribe` function
   * @param listener Listener function
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribe(listener: ListenerFn): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);

    // Return no-operation if already subscribed
    if (this.subscribers.includes(listener)) return noOp;

    // Add listener and  return unsubscriber function
    this.subscribers.push(listener);
    return () => this.unsubscribeListener(listener);
  }

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received.
   * It creates a new subscriber that triggers the listener when `key` is updated, and/or
   * when the value of `key` passes the `valueCheck` function (if one is supplied).
   * @param listener Listener function
   * @param key Key to check for updates
   * @param valueCheck Optional function to assert the value of `key` when it updates.
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribeOnce(
    listener: ListenerFn,
    key: string,
    valueCheck?: (a: any) => boolean
  ): Unsubscriber {
    const unsubscribe = this.subscribe((state, updated) => {
      const exit = () => {
        listener(state, updated);
        unsubscribe();
      };
      // Exit if the key hasn't been updated
      if (!updated.includes(key)) return;

      // If there is no value-checker, trigger the listener and unsubscribe.
      if (!valueCheck) return exit();
      // Trigger the listener if the key was updated, and unsubscribe immediately
      else if (valueCheck(state[key])) return exit();
    });

    return unsubscribe;
  }

  /**
   * Subscribe to changes applied to a subset of state properties.
   * @param listener Listener function
   * @param keys List of state keys to "watch" for updates
   * @param valueCheck Optional function to assert the value of `key` when it updates.
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribeToKeys(
    listener: ListenerFn,
    keys: string[],
    valueCheck = (k: string, v: any) => true
  ): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);

    // construct a custom subscriber
    const keysListener = (s: Partial<ApplicationState>, k: string[]) => {
      // Create a new list of updated keys (subset for listener)
      const updatedKeys: string[] = [];
      const u: Partial<ApplicationState> = keys.reduce((agg, key) => {
        // Copy updated values that appear in the `keys` list and assert value
        if (k.includes(key) && valueCheck(key, s[key])) {
          updatedKeys.push(key);
          return { ...agg, [key]: s[key] };
        }

        return agg;
      }, {});

      // Notify listener if there are updates to be made
      if (updatedKeys.length) listener(u, updatedKeys);
    };

    // return an unsubscribe function
    return this.subscribe(keysListener);
  }

  /**
   * @private Remove a subscriber so that it no longer receives updates.
   */
  private unsubscribeListener(listener: ListenerFn) {
    const matchListener = (l: ListenerFn) => !(l === listener);
    this.subscribers = [...this.subscribers].filter(matchListener);
  }

  /**
   * @private Update the instance with changes, then notify subscribers with a copy
   */
  private updateState(updated: ApplicationState, updatedKeys: string[] = []) {
    this.state = updated;
    this.subscribers.forEach((listener: ListenerFn) =>
      listener(updated, updatedKeys)
    );
  }
}

/**
 * Return an error message when a param is not a function.
 * @param listener Listener function parameter
 * @returns {string|null} Error message or `null` if param is valid
 */
function validateListener(listener: ListenerFn): string | null {
  // This better be a function. Or Else.
  if (typeof listener !== "function") {
    return `Invalid listener: '${typeof listener}' is not a function`;
  }

  return null;
}

/** Passed ref for retaining type definitions */
const ApplicationStore = _ApplicationStore as {
  new <T>(s: T): Store & { [k in keyof T]: StoreUpdaterFn };
};

/** Create an `ApplicationStore` instance */
export default function createState<T extends { [k: string]: any }>(
  initialState: T
): Store & { [k in keyof T]: StoreUpdaterFn } {
  return new ApplicationStore(initialState);
}
