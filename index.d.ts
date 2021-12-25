type G = Record<string,any> & { [x: string]: (any[] | any) | null | undefined };

/**
 * Function that receives the updated state and a list of keys
 */
declare interface ListenerFn<V> {
  (state: V, updatedKeys: string[]): void;
}

/**
 * Function that unsubscribes a listener from the state
 */
declare interface Unsubscriber {
  (): void;
}

/**
 * Function that returns a state representation. `ApplicationStore` is an object
 * instance that turns each key in its constructor args into a method for updating
 * that state property. (e.g. `state.users` = ApplicationStore.users( ... ))
 */
declare function createState<S extends G>(
  s: S
): {
  [x: string]: ((v: any) => void) | any;

  /**
   * Get [a copy of] the current application state
   */
  getState(): S;

  /**
   * Update multiple items in state before notifying subscribers.
   * @param changes A key-value object that represets a subset of your state.
   */
  multiple(changes: Partial<S>): void;

  /**
   * Reset the instance to its initialized state while preserving subscribers.
   * Pass 'true' into the function to also remove all state subscribers.
   * @param clearSubscribers Boolean; when true, `reset` will remove all
   * existing subscribers to state.
   */
  reset(clearSubscribers?: boolean): void;

  /**
   * Subscribe to the state instance. Returns an `unsubscribe` function
   * @param listener Listener function
   * @returns {() => void} Unsubscribe function
   */
  subscribe(listener: ListenerFn<Partial<S>>): Unsubscriber;

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
    listener: ListenerFn<Partial<S>>,
    key: keyof S,
    valueCheck?: (some: any) => boolean
  ): Unsubscriber;

  /**
   * Subscribe to changes applied to a subset of state properties. Optionally takes
   * a value-checker in case you want to subscribe to particular values.
   * @param listener Listener function
   * @param keys List of state keys to "watch" for updates
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribeToKeys(
    listener: ListenerFn<Partial<S>>,
    keys: Partial<keyof S>[] | string[],
    valueCheck?: (key: string, expectedValue: any) => boolean
  ): Unsubscriber;
} & { [k in keyof S]: (u: S[k]) => void };

export = createState;
