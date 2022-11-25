import { filter, from, map, Subject, Subscription } from "rxjs";
import { ApplicationState, ListenerFn, Store, Unsubscriber } from "./types";

const noOp = () => {};

export type StateUpdate = [ApplicationState, string[]];

/**
 * A representation of an Application state.`ApplicationStore` is the state instance that
 * turns each key in its constructor args into a method from updating that state property.
 * (e.g. `state.users` = ApplicationStore.users( ... ))
 */
class _ApplicationStore {
  [x: string]: any;

  private subject: Subject<StateUpdate>;

  /** Hold all subscriptions for one-shot reset */
  private allSubscriptions: Subscription;

  /** Subscribers/Listeners that are called when the state changes */
  private _subscribers: Set<ListenerFn<ApplicationState>>;

  /** Subscribers/Listeners that are called when the state changes */
  subscribers: { length: number };

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
    this.subject = new Subject();
    this.subscribers = { length: 0 };
    this._subscribers = new Set();
    this.allSubscriptions = this.subject.subscribe({ next() {} });

    // Turn every key in the `state` representation into a method on the instance.
    for (let key in state) {
      const updater = (value: any = null): void => {
        const updated = Object.assign({}, this.state, { [key]: value });
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
   * @returns Unsubscribe function
   */
  subscribe(listener: ListenerFn<ApplicationState>): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);

    // Return no-operation if already subscribed
    if (this._subscribers.has(listener)) return noOp;

    const subscription = this.subject.subscribe({
      next: (vals) => {
        const [updatedState, updatedKeys] = vals;
        listener(updatedState, updatedKeys);
      }
    });

    return this.handleSubscription(subscription, listener);
  }

  private handleSubscription(
    subscription: Subscription,
    listener?: ListenerFn<ApplicationState>
  ): Unsubscriber {
    let addedListener = false;

    if (listener) {
      this.allSubscriptions.add(subscription);
      const size = this._subscribers.size;
      this._subscribers.add(listener);
      addedListener = this._subscribers.size > size;
      if (addedListener) this.subscribers.length = this._subscribers.size;
    }

    return () => {
      subscription.unsubscribe();
      if (!listener || !addedListener) return;
      this.allSubscriptions.remove(subscription);
      this._subscribers.delete(listener);
      this.subscribers.length = this._subscribers.size;
    };
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
  subscribeOnce<K extends keyof ApplicationState>(
    listener: ListenerFn<ApplicationState>,
    key?: K,
    expectValue?: (val: ApplicationState[K]) => boolean
  ): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);

    const k = (key || "").toString();
    const subscription = from(this.subject)
      .pipe(
        filter((val) => {
          const match = k === "" || val[1].includes(k);
          return match || (expectValue ? expectValue(val[0][k]) : true);
        })
      )
      .subscribe({
        next: (vals) => {
          const [state, updated] = vals;
          // Exit if key was not updated, or does not have an expected value
          const wasUpdated = !key || updated.includes(k);
          const isExpected = !expectValue || expectValue(state[k]);
          const notify = wasUpdated && isExpected;

          // Trigger the listener
          if (notify) {
            unsubscribeListener();
            return listener(state, [k]);
          }
        }
      });

    const unsubscriber = this.handleSubscription(subscription);
    return unsubscribeListener;

    function unsubscribeListener() {
      unsubscriber();
    }
  }

  /**
   * Subscribe to changes applied to a subset of state properties.
   * @param listener Listener function
   * @param keys List of state keys to "watch" for updates
   * @param valueCheck Optional function to assert the value of `key` when it updates.
   * @returns Unsubscribe function
   */
  subscribeToKeys(
    listener: ListenerFn<ApplicationState>,
    keys: string[],
    valueCheck = (k: string, v: any) => true
  ): Unsubscriber {
    const invalidListener = validateListener(listener);
    if (invalidListener) throw new Error(invalidListener);

    // construct a custom subscriber
    const subscription = from(this.subject)
      .pipe(
        filter(([s, updatedKeys]) => {
          const hasRelevantKeys = updatedKeys.some((uk) => keys.includes(uk));
          return hasRelevantKeys;
        }),
        map(([s, updatedKeys]) => {
          // Copy updated values that appear in the `keys` list
          const rKeys: string[] = updatedKeys.filter((k) => keys.includes(k));
          const newState = rKeys.reduce((agg: StateObject, key: string) => {
            const matches = valueCheck(key, s[key]);
            return matches ? { ...agg, [key]: s[key] } : agg;
          }, {});

          return [newState, rKeys];
        })
      )
      .subscribe((vals) => {
        const [updated, updatedKeys] = vals as StateUpdate;
        if (Object.keys(updated).length === 0) return;
        listener(updated, updatedKeys);
      });

    // return an unsubscribe function
    return this.handleSubscription(subscription, listener);
  }

  /**
   * @private Update the instance with changes, then notify subscribers with a copy
   */
  private updateState(updated: ApplicationState, updatedKeys: string[] = []) {
    this.state = { ...updated };
    this.subject.next([updated, updatedKeys]);
  }
}

/**
 * Return an error message when a param is not a function.
 * @param listener Listener function parameter
 * @returns {string|null} Error message or `null` if param is valid
 */
function validateListener(
  listener: ListenerFn<ApplicationState>
): string | null {
  // This better be a function. Or Else.
  return typeof listener !== "function"
    ? `Invalid listener: '${typeof listener}' is not a function`
    : null;
}

/** Passed ref for retaining type definitions */
const ApplicationStore = _ApplicationStore as { new <T>(s: T): Store<T> };

/** Create an `ApplicationStore` instance */
type StateObject = Record<string, any>;
export default function createState<T extends StateObject>(
  initialState: T
): Store<T> {
  return new ApplicationStore(initialState);
}
