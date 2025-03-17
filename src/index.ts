import { Map } from "immutable";
import { ListenerFn, Store, Unsubscriber } from "./types";

class _ApplicationStore<T extends Record<string, any>> {
  [x: string]: any;

  /** Immutable instance state data that gets updated. */
  private state: Map<string | keyof T, any>;

  /** Subscribers/Listeners that are called when the state changes */
  private _subscribers: Set<ListenerFn<T>> = new Set();

  /** @private Copy of original state args */
  private ref: T | null = null;

  /** @legacy Number of state Subscribers/Listeners */
  subscribers = { length: 0 };

  constructor(initialState: T) {
    if (Object.keys(initialState).length < 1) {
      throw new Error("'state' needs to be an object with at least one key");
    }
    this.state = Map(initialState);
    this.ref = Object.freeze(initialState);

    // Turn every key in the `state` representation into a method on the instance.
    for (let key in initialState) {
      // create a type that represents initialState[key]
      type UpdateValue = (typeof initialState)[typeof key];
      const updater = (value: UpdateValue | null = null): void => {
        const updated = { [key]: value } as T;
        return this.updateState(updated, [key]);
      };

      (this as any)[key] = updater;
    }
  }

  /**
   * Get current state as a JSON string.
   * @returns String representation of state
   */
  serialize() {
    return JSON.stringify(this.getState());
  }

  /** Get [a copy of] the current application state */
  getState(): T {
    return this.state.toJS();
  }

  /** @private Update the instance with changes, then notify subscribers with a copy */
  private updateState(updates: T, keysToUpdate: (keyof T)[] = []): void {
    const newState = keysToUpdate.reduce((state, key) => {
      return state.set(key, updates[key as keyof T]);
    }, this.state);

    if (!this.state.equals(newState)) {
      this.state = newState;
      this.notifySubscribers(keysToUpdate);
    }
  }

  /**
   * Subscribe to the state instance. Returns an `unsubscribe` function
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  subscribe(listener: ListenerFn<T>): Unsubscriber {
    this._subscribers.add(listener);
    this.subscribers.length = this._subscribers.size;

    return () => {
      this._subscribers.delete(listener);
      this.subscribers.length = this._subscribers.size;
    };
  }

  /**
   * Subscribe to changes applied to a subset of state properties.
   * @param listener Listener function
   * @param keys List of state keys to "watch" for updates
   * @param valueCheck Optional function to assert the value of `key` when it updates.
   * @returns Unsubscribe function
   */
  subscribeToKeys<K extends keyof T>(
    listener: ListenerFn<Pick<T, K>>,
    keys: K[],
    valueCheck: { (key: K, value: T[K]): boolean } = () => true
  ): Unsubscriber {
    // Return unsubscribe function
    return this.subscribe((newState, updatedKeys) => {
      // Only notify this listener for changes to specified keys
      const empty = {} as { [k in (typeof keys)[number]]: T[k] };
      const listenerUpdates = keys.reduce((agg, key) => {
        if (updatedKeys.includes(key) && valueCheck(key, newState[key]))
          agg[key] = newState[key];
        return agg;
      }, empty);

      if (Object.keys(listenerUpdates).length === 0) return;

      listener(
        listenerUpdates,
        (updatedKeys as K[]).filter((k) => keys.includes(k))
      );
    });
  }

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received.
   * It creates a new subscriber that triggers the listener when `key` is updated, and/or
   * when the value of `key` passes the `valueCheck` function (if one is supplied).
   * @param listener Listener function
   * @param key Key to check for updates
   * @param expectValue Optional function to assert the value of `key` when it updates.
   * @returns Unsubscribe function
   */
  subscribeOnce<K extends keyof T>(
    listener: ListenerFn<Pick<T, K>>,
    key?: K,
    valueCheck: { (value: T[K]): boolean } = () => true
  ): Unsubscriber {
    // Return unsubscribe function
    const unsubscribe = this.subscribe((next, updated) => {
      if (key) {
        // Stop if key wasn't updated or doesn't have required value
        if (!updated.includes(key) || !valueCheck(next[key])) return;
      }

      listener(next, updated as K[]);
      unsubscribe(); // Unsubscribe after the first update
    });

    return unsubscribe;
  }

  /** Reset the instance to its initialized state. Preserve subscribers. */
  reset(clearSubscribers?: boolean): void {
    if (clearSubscribers) {
      // reset state to initial values without notifying subscribers
      this.state = Map(this.ref as T);
      this._subscribers.clear();
      this.subscribers.length = 0;
    } else this.multiple(this.ref as T);
  }

  /** Dispatch updates to listeners */
  private notifySubscribers(updatedKeys: (keyof T)[]): void {
    const currentState = this.getState();
    this._subscribers.forEach((listener) =>
      listener(currentState, updatedKeys)
    );
  }

  /**
   * Update multiple keys in state before notifying subscribers.
   * @param {Partial<ApplicationState>} changes Data source for state updates. This
   * is an object with one or more state keys that need to be updated.
   */
  multiple(changes: Partial<T>): void {
    if (typeof changes !== "object" || Array.isArray(changes)) {
      throw new Error("State updates need to be a key-value object literal");
    }

    // validate changeset
    const changeKeys: (keyof T)[] = Object.keys(changes) as (keyof T)[];
    changeKeys.forEach((key) => {
      if (!this.state.has(key)) {
        throw new Error(`There is no "${String(key)}" in this state instance.`);
      }
    });

    return this.updateState(changes as T, changeKeys);
  }
}

/** Passed ref for retaining type definitions */
const ApplicationStore = _ApplicationStore as { new <T>(s: T): Store<T> };

// Modify createState function to use Immutable.js
export default function createState<T extends {}>(initialState: T): Store<T> {
  return new ApplicationStore(initialState);
}
