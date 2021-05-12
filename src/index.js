/**
 * A representation of an Application state
 */
class ApplicationState {
  /**
   * State subscribers (list of listeners/functions triggered when state changes)
   */
  subscribers = [];

  /**
   * Application State keys and values
   * @property {object} state Application State
   */
  state = {};

  _ref = null;

  /**
   * `ApplicationState` is a class representation of the magic here.
   * It is instantiable so a user can manage multiple subscriber groups.
   * @param {object} state Initial app state
   */
  constructor(state = {}) {
    /* State requires at least one key */
    if (Object.keys(state).length < 1) {
      const msg =
        "'ApplicationState' needs a state value with at least one key";
      throw new Error(msg);
    }

    // Turn every key in the `state` representation into a method on the instance.
    // This allows entire state updates by calling a single key (e.g.) `state.user({ ... })`;
    for (let key in state) {
      this[key] = (value) => {
        const updated = { ...this.state, [key]: value };
        return this.updateState(updated, [key]);
      };
    }

    // Initialize application state here. These is the key-value
    // source-of-truth for your application.
    this.state = { ...state };
    this._ref = Object.freeze(this.getState());
    return this;
  }

  /**
   * Get [a copy of] the current application state
   */

  getState = () => Object.assign({}, { ...this.state });

  /**
   * Update multiple keys in state before notifying subscribers.
   * @param {object} changes Data source for state updates. This
   * is an object with one or more state keys that need to be updated.
   */
  multiple(changes) {
    if (typeof changes !== "object") {
      throw new Error("State updates need to be a key-value object literal");
    }

    const changeKeys = Object.keys(changes);
    let updated = { ...this.state };

    changeKeys.forEach((key) => {
      if (!this[key]) {
        throw new Error(`There is no "${key}" in this state instance.`);
      } else {
        updated = { ...updated, [key]: changes[key] };
      }
    });

    return this.updateState(updated, changeKeys);
  }

  /**
   * Reset the instance to its initialized state. Preserve subscribers.
   */
  reset() {
    this.multiple({ ...this._ref });
  }

  /**
   * Update the instance with changes, then notify subscribers
   * with a copy
   */
  updateState(updated, updatedKeys = []) {
    this.state = updated;
    this.subscribers.forEach((listener) => listener(updated, updatedKeys));
  }

  subscribe = (listener) => {
    // This better be a function. Or Else.
    if (typeof listener !== "function") {
      const msg = `Invalid listener: '${typeof listener}' is not a function`;
      throw new Error(msg);
    }

    if (!this.subscribers.includes(listener)) {
      // Add listener
      this.subscribers.push(listener);

      // return unsubscriber function
      return () => this.unsubscribeListener(listener);
    }
  };

  unsubscribeListener = (listener) => {
    const matchListener = (l) => !(l === listener);
    return (this.subscribers = [...this.subscribers].filter(matchListener));
  };
}

/**
 * Create an `Application State` object representation. This requires
 * a key-value state object, whose keys will be attached to setter functions
 * on the new `Application State` instance
 * @param {object} state State representation
 */
export default function createState(state) {
  return new ApplicationState(state);
}
