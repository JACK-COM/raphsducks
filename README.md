# Raph's Ducks
Sweet merciful heavens; not _another_ State Manager...

## Installation
    npm install raphsducks

## Usage: (or how to interact with hypothetical ducks)
### Instantiate your store using the result of `create(reducers)`
```
    // File: Store.js

    import reducer1 from './reducer1';
    import reducer2 from './reducer2';
    import * as GroupOfFunctions from './somewhere/else';

    const MyStore = create({ reducer1, reducer2, ...GroupOfFunctions });
    
    export default MyStore;
```
`create(reducers)` will: 
* Construct an initial state using the `reducers` object. 
    * Unless a particular reducer uses default arguments (not recommended), all initial state values will be `null`. 
* Return an object with `getState, dispatch, subscribe` methods.

### Import your store anywhere you want to interact with it.
```
    import { getState, dispatch, subscribe } from './path/to/Store.js';
    
    // or: import Store from './path/to/Store.js';
    // gives: Store.getState, Store.dispatch, Store.subscribe 
```

### Interact with it.
* Subscribe for updates (receives updated `state` when called)
```
    const unsubscribe = subscribe(state => /* do something with state.properties */);
```

* Get values
```
    const { someStateProperty } = getState();
```
    
* Make updates
```
    const updatedProperty = getState().numericalStateProperty + 1;

    dispatch({ type: "NAME_OF_REDUCER_I_WANT_TO_CALL", payload: updatedProperty });
```

* Batch updates (will notify subscribers once all have been processed)
```
    dispatch(
        { type: "A_REDUCER", payload: someValue },
        { type: "ANOTHER_REDUCER", payload: [anUnrelatedValue, "An expletive"] },
        ...
    );
```

* Unsubscribe
```
    const unsubscribe = subscribe(myUpdateFunctionReference);

    unsubscribe();
```

## API
### `create(reducers: {[string]: Function })` => ({ getState, dispatch, subscribe })
* Create a new Store using the supplied `reducers`
    * `reducers` is an object whose keys are strings, and whose values are functions.
* Each `reducer` is a pure function that converts its arguments into (and returns) an object-literal
    * For example: `MY_REDUCER(someStateValue)` returns `{ "someStateValue": someStateValue }`
* `create` instantiates a `state` object. This object's keys are determined by your `reducers` param
* Returns `{ getState, dispatch, subscribe }`

### `dispatch(...actions: {type: string, payload: any })`
* For each `action` in `arguments`:
    * Modify state using one or more `reducer` whose name is `action.type`
    * Notify all `subscribers` that state has been updated
* Does not return

### `subscribe(listener: Function)`
* Listen for state modifications
* Call `listener()` when state changes
* Returns a function to unsubscribe from state changes


## Development
    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

Run tests with `npm test`


## Explanation 
### What is (are?) `Raph's Ducks`?
    Another redux-inspired publish/subscribe state-management system. 
* Defines a single State object, to which any component can listen for changes
* Uses the familiar `dispatch`, `getState`, and `subscribe` API for notifying of update, checking current state, and, listening to state updates, respectively
* Includes a `create` method for instantiating the state/store

### Why did you choose that name?
    I didn't.             ( ._.)


### Does this need React or Redux?
    Nope
* Although it was inspired by using one, and learning patterns from the latter, this is _severely_ unrelated to both. 

### Can I use this in React?
    Probably
* This project duplicates the core of a system that I _originally developed in a React application_. 
* The `Store/API` was always kept as vanilla JS for easy transfer between projects
* You can probably interact with it using the HOC/provider pattern:
    * Create a `WrapperComponent` to handle subscribing and unsubscribing from the `Store`
    * `WrapperComponent` uses a `mapPropsToState` fn to copy the parts of `Store.getState()` that it cares about to its internal state
    * On update, `WrapperComponent` checks if the "interesting" parts of `Store.getState()` have changed
    * If so, `WrapperComponent` updates and supplies props to the wrapped component

### Why not just use redux?
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. 
* For the record, not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 

I only wanted something with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with multiple application files. Redux does a good deal more than _raphsducks_'s humble collection of lines, and has years of testing and a vibrant community behind it. I have never used it, but would likely recommend it if you've got a large enough team, a complex enough project, _and_ lack the ability to build your application from the ground up.

