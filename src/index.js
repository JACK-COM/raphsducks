export default {
    createState,
    createSetterActions
};

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
export function createState(setters) {
    return new ApplicationState(setters);
}

/**
 * Helper to create Actions
 * @param {*} setters 
 */
export function createSetterActions(setters) {
    const Actions = {};
    for (let setterName in setters) {
        Actions[`${setterName}Action`] = payload => ({ type: setterName, payload });
    }
    return Actions;
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
        
        // Methods
        this.dispatch = (...actions) => {
            if (actions.length === 0) return;
            const copyState = { ...this.state };
            this.state = __updateStateAndNotify(copyState, this.setters, actions, this.subscribers);
            return null; 
        }
    
        this.getState = () => Object.assign({}, { ...this.state })
    
        this.subscribe = (listener) =>  {
            // This better be a function. Or Else.
            if (typeof listener !== "function") {
                throw new Error(`Invalid listener: '${typeof listener}' is not a function`);
            }
        
            if (this.subscribers.indexOf(listener) > -1) return;
            // Add listener
            this.subscribers.push(listener);
            // return unsubscriber function
            return () => this.subscribers = [...this.subscribers].filter(l => !(l === listener));
        }

        // Initialize state with null props
        const initActions = Object.keys(stateSetters).map(makeNullAction);
        this.dispatch(...initActions);
    }
}

// Helpers

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
    return { ...updated };
}