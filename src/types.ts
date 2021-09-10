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
  multiple(changes: ApplicationState): void;

  /** Reset the instance to its initialized state. Preserve subscribers. */
  reset(): void;

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribe(listener: Listener): () => void;

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribeOnce(listener: Listener, key: string): void;
}

type StoreUpdaterFn = {
  /** Function for updating a state key */
  (value?: any): void;
};

/** State Listeners are functions that are called when the state changes */
type Listener = {
  (state: ApplicationState, updatedKeys: string[]): void;
};
