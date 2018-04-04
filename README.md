# Raph's Ducks
Sweet merciful heavens; not _another_ State Manager...

## Installation
    npm i @jackcom/raphsducks

## Usage: (or how to interact with hypothetical ducks)
### Instantiate your store using the result of `create(reducers)`
```javascript
    // File: Store.js
    import create from '@jackcom/raphsducks';
    import reducer1 from './path/to/functions/reducer1';
    import reducer2 from './other/path/to/functions/reducer2';
    import * as MyGroupOfFunctions from './somewhere/else';

    const MyStore = create({ reducer1, reducer2, ...MyGroupOfFunctions });
    export default MyStore;

    // or: export default create({ reducer1, reducer2, ...GroupOfFunctions });
```
`create(reducers)` will: 
* Construct an initial state using the `reducers` object. 
    * Unless a particular reducer uses default arguments (not recommended), all initial state values will be `null`. 
* Return an object with `getState, dispatch, subscribe` methods.

### Import your store anywhere you want to interact with it.
```javascript
    import { getState, dispatch, subscribe } from './path/to/Store.js';
    
    // or: import Store from './path/to/Store.js';
    // gives: Store.getState, Store.dispatch, Store.subscribe 
```

### Interact with it.
* Subscribe for updates (receives updated `state` when called)
```javascript
    const unsubscribe = subscribe(state => /* do something with state.properties */);
```

* Get values
```javascript
    const { someStateProperty } = getState();
```
    
* Make updates
```javascript
    const updatedProperty = getState().numericalStateProperty + 1;

    dispatch({ type: "NAME_OF_REDUCER_I_WANT_TO_CALL", payload: updatedProperty });
```

* Batch updates (will notify subscribers once all have been processed)
```javascript
    dispatch(
        { type: "A_REDUCER", payload: someValue },
        { type: "ANOTHER_REDUCER", payload: [anUnrelatedValue, "An expletive"] },
        ...
    );
```

* Unsubscribe
```javascript
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
* This was directly inspired by [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux")
* That said, _raphsducks_ is vanilla JS.

### Can I use this in React?
~~Probably~~
    Yes, using the HOC/provider pattern:
1. Create a `WrapperComponent` to handle subscribing and unsubscribing from the `Store`
2. `WrapperComponent` uses a `mapPropsToState` function to copy the parts of `Store.getState()` that it cares about to its internal state
3. On update, `WrapperComponent` checks if the "interesting" parts of `Store.getState()` have changed
4. If so, `WrapperComponent` updates and supplies props to the wrapped component
5. Export dependants as `WrapperComponent(MyDependantComponent, mapPropsToState)`

### Why not just use redux?
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 
* ...You're right. Why _not_ just use redux?

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with multiple application files, so I built this. As with many modern JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.