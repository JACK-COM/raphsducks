export default create;

// Listeners go here
let subscribers = [];
// Application state goes here
let state = {};
// Reducers go here
let Reducers = {};
// Helpers
const assertIsFunction = object => typeof object === "function";
const makeNullAction = type => ({ type, payload: null });

/**
 * Create a `Store` to represent application state. Takes 
 * `reducers` (key-value object whose values are functions that write
 * to unique state properties), optional `uniqueStore` to specify whether
 * created store is unique instance or shared as singleton
 * @param {*} reducers 
 * @param {boolean} uniqueStore 
 */
function create(reducers, uniqueStore = false) {
    if (uniqueStore === true) return new Store(reducers);

    const keys = [];
    // Initialize reducers
    Object.keys(reducers).forEach(key => {

        if (!reducers.hasOwnProperty(key)) return;
        // Property must be a function
        if (!assertIsFunction(reducers[key])) {
            throw new Error(`Invalid reducer: property ${key}'' is not a function`);
        }
        // Property name must be unique
        if (Reducers[key]) {
            throw new Error(`Conflict: reducer "${key}" has already been registered`);
        }

        // Assign property to Reducers
        Reducers[key] = reducers[key];
        keys.push(key);
    });

    // Initialize state
    dispatch(...keys.map(makeNullAction));

    // Return methods

    return {
        create,
        getState,
        subscribe,
        dispatch
    };
}

/**
 * `Store` is a class representation of the magic here; instantiable to 
 * allow tracking/managing separate groups of subscribers
 */
class Store {
    constructor(reducers) {
        this.subscribers = [];
        this.state = {};
        this.reducers = reducers;
        
        const keys = Object.keys(reducers);
        this.dispatch(...keys.map(makeNullAction))
    }

    dispatch(...actions) {
        if (actions.length === 0) {
            throw new Error("Invalid dispatch: check action parameters");
        }
    
        const types = {};
        actions.forEach(action => {
            this.state = reduce(this.state, action);
            types[action.type] = true;
        });
    
        const nextState = {...this.state};
        subscribers.forEach(listener => listener(nextState, types));
    }

    getState() {
        return Object.assign({}, { ...this.state });
    }

    subscribe(listener) {
        // This better be a function. Or Else.
        if (typeof listener !== "function") {
            throw new Error(`Invalid listener: '${typeof listener}' is not a function`);
        }

        if (this.subscribers.indexOf(listener) > -1) return;
        // Add listener
        this.subscribers.push(listener);
        // return unsubscriber function
        return () => this.subscribers = this.subscribers.filter(l => !(l === listener));
    }
}

function dispatch(...actions) {
    if (actions.length === 0) {
        throw new Error("Invalid dispatch: check action parameters");
    }

    const types = {};
    actions.forEach(action => {
        state = reduce(state, action);
        types[action.type] = true;
    });

    const nextState = {...state};
    subscribers.forEach(listener => listener(nextState, types));
}

function getState() {
    return Object.assign({}, {...state});
}

function reduce(state, action, reducers = Reducers) {
    const { type, payload } = action;
    if (!reducers[type]) return state;
    // 
    return Object.assign({}, {...state}, reducers[type](payload));
}

function subscribe(listener) {
    // This better be a function. Or Else.
    if (typeof listener !== "function") {
        throw new Error(`Invalid listener: '${typeof listener}' is not a function`);
    }

    if (subscribers.indexOf(listener) > -1) return;
    // Add listener
    subscribers.push(listener);
    // return unsubscriber function
    return () => subscribers = subscribers.filter(l => !(l === listener));
}