declare interface ListenerFn {
  (state: { [x: string]: any }, updatedKeys: string[]): void;
}

type G = { [x: string]: (any[] | any) | null | undefined };

declare function createState<S extends G>(
  s: S
): {
  [x: string]: ((v: any) => void) | any;

  /** Get [a copy of] the current application state */
  getState(): S;

  /** Update multiple items in state before notifying subscribers. */
  multiple(changes: Partial<S>): void;

  /** 
   * Reset the instance to its initialized state while preserving subscribers. 
   * Pass 'true' into the function to also remove all state subscribers.
   */
  reset(clearSubscribers?: boolean): void;

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribe(listener: ListenerFn): () => void;

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received
   */
  subscribeOnce(listener: ListenerFn, key: string, valueCheck?: (some: any) => boolean): void;
} & { [k in keyof S]: (u: any) => void };

export = createState;
