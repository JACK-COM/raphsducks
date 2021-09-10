declare interface Listener {
  (state: { [x: string]: any }, updatedKeys: string[]): void;
}

declare function createState<T>(s: T): {
  [x: string]: ((v: any) => void) | any;

  /** Get [a copy of] the current application state */
  getState(): T;

  /** Update multiple keys in state before notifying subscribers. */
  multiple(changes: T): void;

  /** Reset the instance to its initialized state. Preserve subscribers. */
  reset(): void;

  /** Subscribe to the state instance. Returns an `unsubscribe` function */
  subscribe(listener: Listener): () => void;
} & { [k in keyof T]: (u: any) => void };

export = createState;
