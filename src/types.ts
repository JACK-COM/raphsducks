/** Initial state argument */
type ApplicationState = {
  [k: string]: any | any[] | null;
};

/** State instance */
interface Store {
  [x: string]: StoreUpdaterFn | any;

  /** Get [a copy of] the current application state */
  getState(): ApplicationState;

  /** Update multiple keys in state before notifying subscribers. */
  multiple(changes: Partial<ApplicationState>): void;

  /**
   * Reset the instance to its initialized state while preserving subscribers.
   * Pass 'true' into the function to also remove all state subscribers.
   */
  reset(clearSubscribers?: boolean): void;

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribe(listener: Listener): () => void;

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received
   */
  subscribeOnce(
    listener: Listener,
    key: string,
    valueCheck?: (some: any) => boolean
  ): void;
}

type StoreUpdaterFn = {
  /** Function for updating a state key */
  (value?: any): void;
};

/** State Listeners are functions that are called when the state changes */
type Listener = {
  (state: ApplicationState, updatedKeys: string[]): void;
};
