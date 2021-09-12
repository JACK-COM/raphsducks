const noOp = () => {};

/**
 * A representation of an Application state.`ApplicationStore` is the state instance that
 * turns each key in its constructor args into a method from updating that state property.
 * (e.g. `state.users` = ApplicationStore.users( ... ))
 */
class _ApplicationStore {
  [x: string]: any;

  /** Subscribers/Listeners that are called when the state changes */
  subscribers: Listener[] = [];

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
  multiple(changes: Partial<ApplicationState>) {
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

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribe(listener: Listener): () => void {
    // This better be a function. Or Else.
    if (typeof listener !== "function") {
      const msg = `Invalid listener: '${typeof listener}' is not a function`;
      throw new Error(msg);
    }

    // Add listener and  return unsubscriber function
    if (!this.subscribers.includes(listener)) {
      this.subscribers.push(listener);
      return () => this.unsubscribeListener(listener);
    }

    // Return no-operation
    return noOp;
  }

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received
   */
  subscribeOnce(
    listener: Listener,
    key: string,
    valueCheck?: (a: any) => boolean
  ): void {
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
  }

  private unsubscribeListener(listener: Listener) {
    const matchListener = (l: Listener) => !(l === listener);
    this.subscribers = [...this.subscribers].filter(matchListener);
  }

  /** @private Update the instance with changes, then notify subscribers with a copy */
  private updateState(updated: ApplicationState, updatedKeys: string[] = []) {
    this.state = updated;
    this.subscribers.forEach((listener: Listener) =>
      listener(updated, updatedKeys)
    );
  }
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
