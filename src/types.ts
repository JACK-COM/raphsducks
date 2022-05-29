/** Initial state argument */
type ApplicationState = {
  [k: string]: any | any[] | null;
};

/** State instance */
type Store<T> = {

  /** @private property: list of subscribers */
  subscribers: ListenerFn[]

  /** Get [a copy of] the current application state */
  getState(): T;

  /** Update multiple keys in state before notifying subscribers. */
  multiple(changes: Partial<T>): void;

  /**
   * Reset the instance to its initialized state while preserving subscribers.
   * Pass 'true' into the function to also remove all state subscribers.
   */
  reset(clearSubscribers?: boolean): void;

  /**
   * Subscribe to the state instance. Returns an `unsubscribe` function
   * @param listener Listener function
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribe(listener: ListenerFn): Unsubscriber;

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
  subscribeOnce<K extends keyof T>(
    listener: ListenerFn,
    key: K,
    valueCheck?: (some: T[K]) => boolean
  ): Unsubscriber;

  /**
   * Subscribe to changes applied to a subset of state properties. Optionally takes
   * a value-checker in case you want to subscribe to particular values.
   * @param listener Listener function
   * @param keys List of state keys to "watch" for updates
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribeToKeys(
    listener: ListenerFn,
    keys: string[],
    valueCheck?: (key: string, expectedValue: any) => boolean
  ): Unsubscriber;
} & { [k in keyof T]: StoreUpdaterFn<T[k]> };

/** Function for updating a state key */
type StoreUpdaterFn<T> = { (value: T): void };

/** State Listeners are functions that are called when the state changes */
type ListenerFn = {
  (state: ApplicationState, updatedKeys: string[]): void;
};

type Unsubscriber = {
  (): void;
};
