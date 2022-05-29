import { Subject, Subscription } from "rxjs";

const noOp = () => {};

/**
 * A representation of an Application state.`ApplicationStore` is the state instance that
 * turns each key in its constructor args into a method from updating that state property.
 * (e.g. `state.users` = ApplicationStore.users( ... ))
 */
class _ApplicationStore {
  [x: string]: any;

  private subject: Subject<[ApplicationState, string[]]> = new Subject();

  /** Hold all subscriptions for one-shot reset */
  private allSubscriptions: Subscription;

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
    this.allSubscriptions = this.subject.subscribe({ next() {} });

    // Turn every key in the `state` representation into a method on the instance.
    for (let key in state) {
      const updater = (value: any = null): void => {
        const updated = { ...this.state, [key]: value };
        return this.updateState(updated, [key]);
      };

      // (this as any)[key] = updater;
      (this as Store<ApplicationState>)[key] = updater;
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
    // reset state to initial values without notifying subscribers
    this.state = { ...this.ref };
    if (clearSubscribers) {
      this.allSubscriptions.unsubscribe();
      this.subscribers = [];
    }
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
    if (isSubscribed(listener, this.subscribers)) return noOp;
    this.subscribers.push(listener);

    const listenerSub = this.subject.subscribe({
      next: (s: [updatedState: any, updatedKeys: string[]]) => {
        listener(s[0], s[1]);
      },
    });

    this.allSubscriptions.add(listenerSub);
    return listenerSub.unsubscribe;
  }

  /**
   * Subscribe until a specified `key` is updated, then unsubscribe. Optionally takes
   * a value-checker in case you want to subscribe until a particular value is received.
   * It creates a new subscriber that triggers the listener when `key` is updated, and/or
   * when the value of `key` passes the `valueCheck` function (if one is supplied).
   * @param listener Listener function
   * @param key Key to check for updates
   * @param expectValue Optional function to assert the value of `key` when it updates.
   * @returns {Unsubscriber} Unsubscribe function
   */
  subscribeOnce<K extends keyof ApplicationState>(
    listener: ListenerFn,
    key: K,
    expectValue?: (val: ApplicationState[K]) => boolean
  ): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);
    // Return no-operation if already subscribed
    if (isSubscribed(listener, this.subscribers)) return noOp;
    this.subscribers.push(listener);

    const k = key.toString();
    const exit = () => {
      listener(this.state, [k]);
      subscription.unsubscribe();
    };

    const subscription = this.subject.subscribe({
      next(vals) {
        const [state, updated] = vals;
        // Exit if the key hasn't been updated
        if (!updated.includes(k)) return;
        // Trigger the listener if the key was updated
        if (!expectValue) return exit();
        // Trigger the listener if the updated value matches listener's expectations
        if (expectValue(state[k])) return exit();
      },
    });

    return subscription.unsubscribe;
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
   * @private Update the instance with changes, then notify subscribers with a copy
   */
  private updateState(updated: ApplicationState, updatedKeys: string[] = []) {
    this.state = updated;
    const copy = { ...updated };
    this.subject.next([copy, updatedKeys]);
  }
}

/**
 * Assert a listener is not in fact subscribed
 * @param listener Listener function parameter
 * @returns Boolean assertion
 */
function isSubscribed(listener: ListenerFn, subscribers: ListenerFn[]) {
  const stringscribers = subscribers.map((f) => f.toString());
  const serialized = listener.toString();
  const matchSerialized = stringscribers.includes(serialized);
  const matchListener = subscribers.includes(listener);
  return matchSerialized && matchListener;
}

/**
 * Return an error message when a param is not a function.
 * @param listener Listener function parameter
 * @returns {string|null} Error message or `null` if param is valid
 */
function validateListener(listener: ListenerFn): string | null {
  // This better be a function. Or Else.
  return typeof listener !== "function"
    ? `Invalid listener: '${typeof listener}' is not a function`
    : null;
}

/** Passed ref for retaining type definitions */
const ApplicationStore = _ApplicationStore as {
  new <T>(s: T): Store<T>;
};

/** Create an `ApplicationStore` instance */
type StateObject = Record<string, any>;
export default function createState<T extends StateObject>(
  initialState: T
): Store<T> {
  return new ApplicationStore(initialState);
}
