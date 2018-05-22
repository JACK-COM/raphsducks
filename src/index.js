export default createState;

// Helpers
const assertIsFunction = object => typeof object === "function";
const makeNullAction = type => ({
    type,
    payload: null
});

/**
 * Create an `Application State` object representation. This requires 
 * `setters` (key-value object whose values are functions that write
 * to unique state properties), and an optional boolean to specify whether
 * created store is unique instance or shared as singleton
 * @param {*} setters 
 * @param {boolean} shouldBeUniqueInstance 
 */
function createState(setters) {
    return new ApplicationState(setters);
}

/**
 * `ApplicationState` is a class representation of the magic here. 
 * It is instantiable so a user can manage multiple subscriber groups
 */
class ApplicationState {

    constructor(stateSetters) {
        //  validate that `stateSetters` contains functions
        const validKeys = {};
        for (let key in stateSetters) {
            // Property name must be unique
            if (validKeys[key]) {
                throw new Error(`Conflict: "${key}" has already been registered`);
            }
            // Property must be a function
            if (!assertIsFunction(stateSetters[key])) {
                throw new Error(`Invalid setter: ${key}'' is not a function`);
            }
            // Flag key as valid
            validKeys[key] = true;
        }
        // Application state property setters go here
        this.setters = stateSetters;
        // Application state goes here
        this.state = {};
        // Listeners go here
        this.subscribers = [];
        // Initialize state with null props
        const initActions = Object.keys(stateSetters).map(makeNullAction);
        this.dispatch(...initActions);
    }

    dispatch = (...actions) => {
        if (actions.length === 0) {
            throw new Error("Invalid dispatch: check action parameters");
        }
        const copyState = { ...this.state
        };
        this.state = __updateStateAndNotify(this.state, this.setters, actions, this.subscribers);
    }

    getState = () => Object.assign({}, { ...this.state
    })

    subscribe = (listener) => {
        return __linkSubscription(listener, this.subscribers)
    }
}

// Helpers (to minimize code duplication)
function __linkSubscription(listener, subscribersList) {
    // This better be a function. Or Else.
    if (typeof listener !== "function") {
        throw new Error(`Invalid listener: '${typeof listener}' is not a function`);
    }

    if (subscribersList.indexOf(listener) > -1) return;
    // Add listener
    subscribersList.push(listener);
    // return unsubscriber function
    return () => subscribersList = subscribersList.filter(l => !(l === listener));

}

// `__merge` updates state one property at a time
function __updateState(state, setters, action) {
    const { type, payload } = action;
    if (!setters[type]) return state;
    return Object.assign({ ...state }, setters[type](payload));
}

// `__updateAndNotify` abstracts state update and listener notification
function __updateStateAndNotify(state, stateSetters, actions, subscribers) {
    const updated = actions.reduce((s, a) => __updateState(s, stateSetters, a), state);
    subscribers.forEach(listener => listener(updated));
    return { ...updated
    };
}