# Raph's Ducks
Sweet merciful heavens; not _another_ State Manager...

## Installation
    npm i @jackcom/raphsducks

## Usage: (or how to interact with hypothetical ducks)
### Instantiate your store using the result of `create(reducers, isUniqueStore)`
```typescript
    // File: Store.js
    import create from '@jackcom/raphsducks';
    import reducer1 from './my/path/to/reducers/reducer1';
    import reducer2 from './my/path/to/reducers/reducer2';
    import * as MyGroupOfFunctions from './somewhere/else';

    // Copy all functions into an object
    const mergedReducers = { reducer1, reducer2, ...MyGroupOfFunctions };
    // Create a shared store for all subscribers
    const BooksStore = create(mergedReducers);
    // Or a unique instance, isolated from `BookStore`,
    // using the optional boolean param `isUniqueStore`
    const SomeRelatedStore = create(mergedReducers, true);

    export default BooksStore; // or just export create(mergedReducers);
    export SomeRelatedStore;

```
`create(reducers, isUniqueStore)` will: 
* Construct an initial state using the `reducers` object. 
* Return a State object with `getState, dispatch, subscribe` methods.
* The State object has keys reflecting all supplied reducers, and values of null
    * You can change this by giving a particular reducer default arguments (not recommended)

`create(reducers, true)` will create a unique Store or state instance, which is helpful 
when you want to manage groups of subscribers separately

```typescript
    // Import your store anywhere you want to interact with it.
    import { getState, dispatch, subscribe } from './path/to/Store.js';
    // import Store from './path/to/Store.js'; => Store.getState, ... 

    // Define your state listener
    const onStateChange = (state, actionsPerformed) => {
        // `state` = copy of updated state
        // `actionsPerformed` = object whose keys are the last actions dispatched
        // Check for state props and update as needed
    };
    // Create unsubscribe function by subscribing to store
    const unsubscribe = subscribe(onStateChange); 
    // Get values by calling `getState`
    const { someStateProperty } = getState();
    // Make or batch updates
    // (notifies subscribers when all have been processed)
    const updatedProperty = getState().numericalStateProperty + 1;
    dispatch(
        { type: "NAME_OF_REDUCER_I_WANT_TO_CALL", payload: updatedProperty },
        { type: "ANOTHER_REDUCER", payload: [anUnrelatedValue, "An expletive"] },
        ...
    );
    // Unsubscribe
    unsubscribe();
```

## API
### `create(reducers: {[string]: Function }, isUniqueStore? : true | undefined)` => ({ getState, dispatch, subscribe })
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
    A(nother) redux-inspired publish/subscribe state-management system. 
* Defines a unique or shared State object, to which any component can subscribe for changes
* Uses a familiar `dispatch`, `getState`, and `subscribe` API for notifying of update, checking current state, and, listening to state updates, respectively
* Includes a `create` method for instantiating the state/store

### How is it different from Redux?
_Raphsducks_ is a very lightweight library that allows you to instantiate a state and subscribe to/unsubscribe from it. Some key differences between how it operates and redux (as far as I'm currently aware) are: 
* It passes a copy of the updated state to subscribers following a dispatch
* It also passes an object whose keys are recently-called Store reducers.

To the latter point, this object simplifies the process of checking what state keys were updated (as opposed to comparing the objects themselves). If a key is in the object, that reducer was just called to update the state. Since reducers will only operate on one value at a time, a subscriber can use this to infer what state updates can be safely ignored. This however is left to the _Raphsducks_ user to implement or ignore, a choice which doesn't impact using the library.


### Why did you choose that name?
    I didn't.             ( ._.)


### Does this need React or Redux?
    Nope
* This was directly inspired by [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux")
* That said, _raphsducks_ is vanilla JS.
* Although it was inspired by using one, and learning patterns from the latter, this is _severely_ unrelated to both redux and React at this time. 

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