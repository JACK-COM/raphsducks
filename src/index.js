export default create;

// Listeners go here
let subscribers = [];
// Application state goes here
let state = {};
// Application state property setters go here
let Setters = {};
// Helpers
const assertIsFunction = object => typeof object === "function";
const makeNullAction = type => ({ type, payload: null });

/**
 * Create an `Application State` object representation. This requires 
 * `setters` (key-value object whose values are functions that write
 * to unique state properties), and an optional boolean to specify whether
 * created store is unique instance or shared as singleton
 * @param {*} setters 
 * @param {boolean} shouldBeUniqueInstance 
 */
function create(setters, shouldBeUniqueInstance = false) {
    if (shouldBeUniqueInstance === true) return new ApplicationState(setters);

    const keys = [];
    // Initialize reducers
    Object.keys(setters).forEach(key => {

        if (!setters.hasOwnProperty(key)) return;
        // Property must be a function
        if (!assertIsFunction(setters[key])) {
            throw new Error(`Invalid reducer: property ${key}'' is not a function`);
        }
        // Property name must be unique
        if (Setters[key]) {
            throw new Error(`Conflict: reducer "${key}" has already been registered`);
        }

        // Assign property to Reducers
        Setters[key] = setters[key];
        keys.push(key);
    });

    // Initialize state
    const initActions = keys.map(makeNullAction)
    dispatch(...initActions);

    // Return methods
    return {
        create,
        getState,
        subscribe,
        dispatch
    };
}

/**
 * `ApplicationState` is a class representation of the magic here. 
 * It is instantiable so a user can manage multiple subscriber groups
 */
class ApplicationState {
    
    constructor(stateSetters) {
        this.setters = stateSetters;
        this.state = {};
        this.subscribers = [];
        // Initialize state with null props
        const initActions = Object.keys(stateSetters).map(makeNullAction);
        this.dispatch(...initActions);
    }

    dispatch(...actions) {
        if (actions.length === 0) {
            throw new Error("Invalid dispatch: check action parameters");
        }
        this.state = __updateStateAndNotify(this.state, this.setters, actions, this.subscribers);
    }

    getState() {
        return Object.assign({}, { ...this.state });
    }

    subscribe(listener) {
        return __linkSubscription(listener, this.subscribers)
    }
}

function dispatch(...actions) {
    if (actions.length === 0) {
        throw new Error("Invalid dispatch: check action parameters");
    }
    state = __updateStateAndNotify(state, Setters, actions, subscribers);
}

function getState() {
    return Object.assign({}, {...state});
}

function subscribe(listener) {
    return __linkSubscription(listener, subscribers)
}

// Helpers (to minimize code duplication)
function __linkSubscription(listener, subscribersList){
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
    return Object.assign({...state}, setters[type](payload));
}

// `__updateAndNotify` abstracts state update and listener notification
function __updateStateAndNotify(state, stateSetters, actions, subscribers) {
    const updated = actions.reduce((s, a) => __updateState(s, stateSetters, a), state);
    subscribers.forEach(listener => listener(updated));
    return {...updated};
}