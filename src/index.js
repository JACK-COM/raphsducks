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

function create(reducers, initialState = null) {
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

function dispatch(...actions) {
    if (actions.length === 0) {
        throw new Error("Invalid dispatch: check action parameters");
    }

    actions.forEach(action => state = reduce(state, action));
    const nextState = {...state};
    subscribers.forEach(listener => listener(nextState));
}

function getState() {
    return Object.assign({}, {...state});
}

function reduce(state, action) {
    const { type, payload } = action;
    if (!Reducers[type]) return state;
    // 
    return Object.assign({}, {...state}, Reducers[type](payload));
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