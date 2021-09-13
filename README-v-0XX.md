# `@deprecated` | Raph's Ducks - v.0.5.1

> **Note:** All versions below v1.X.X have been deprecated with *extreme* prejudice. Absolutely no support will be provided for them, and it is recommended that you migrate to the newer versions ASAP.

Sweet merciful heavens; not _another_ State Manager...

## Table Of Contents
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
    * [createState](#createState(setters))
    * [dispatch](#dispatch(...actions))
    * [subscribe](#subscribe(listener))
    * [getState](#getState())
* [Terminology](#terminology)
    * [Actions](#actions)
    * [Listener Functions](#listener-functions)
    * [Setter Functions](#setter-functions)
    * [(Application) State](#application-state)
* [Explanation](#explanation)
* [Development](#development)

## Installation
    npm i @jackcom/raphsducks

## Usage
### 1. Instantiate and export your `state` using the result of `createState(setters)`
```typescript
    // File: MyApplicationState.js
    import createState from '@jackcom/raphsducks';

    // import your state property setters
    import * as aGroupOfSetterFunctions from './path/to/my/setters';

    // Define or import state property setters
    const setTodos = (todos: ToDo[]) => ({ todos });
    
    // Merge setters into an object
    const mergedSetters = { setTodos, ...aGroupOfSetterFunctions };
    
    // Export one or more unique instances 
    export default createState(mergedSetters);

```

### 2. Use your `state` in a file (or application component, or, you know, wherever)
```typescript
    // MeanwhileAtAComponentFactory.js

    // Import destructured methods (shared instance only!)
    import { getState, dispatch, subscribe } from './path/to/MyApplicationState.js';

    // Define (or import) your state listener
    const stateListener = (updatedState) => {/* do something with updated state */};

    // Create unsubscribe function by subscribing to state with your listener
    const unsubscribe = subscribe(stateListener); 

    // Get values by calling `getState`
    const numericProperty = getState().numericProperty;
    
    // Make or batch updates (notifies subscribers when all have been processed)
    dispatch(
        { type: "NUMERIC_PROP_SETTER_NAME", payload: numericProperty + 1 },
        { type: "ANOTHER_PROP_SETTER_NAME", payload: null },
    );

    // Unsubscribe when done
    unsubscribe();
```


## API
### `createState(setters)`
* Creates a new `state`  using the supplied [setters](#setter-functions). Parameters:
    * `setters`: an object with string keys and function values.
* Returns: an initial [State](#application-state "Application State") with keys reflecting all supplied setters, and initial values of null

### `dispatch(...actions)`
* Uses the supplied `actions` to update state. Parameters: 
    * `action`: an object literal with a `type` and `payload` property. See [Actions](#actions "Actions")
* Returns `void`

### `subscribe(listener)`
* Listens for state modifications and creates an 'unsubscription' function
* Call [listener()](#listener-functions) when state changes
* Returns a function to unsubscribe from state changes

### `getState()` 
* Gets current state
* Returns (copy of) current state


## Terminology
### `Actions`
An `Action` is an object literal describing a single operation to perform on your `state`. Required properties:
    * `type`: a string whose value is the name of the [setter](#setter-functions "Setter Functions") you want to call
    * `payload`: any value(s) to be returned by the called `setter`

### `Listener Functions`
A `listener` is a function that reacts to state updates. Required parameters: 
    * `state`: the updated `state` object. 
    
```typescript
    // A basic Listener runs comparisons against internals: 
    const myListener = (updatedState) => {
        if (updatedState.someProperty === myPreviousStateCopy.someProperty) return; 
        // else, `state.someProperty` changed: do something with it! Be somebody!
    };
```

### `Setter Functions`
A `setter` is a "pure" JS function (no side-effects) that sets one or more properties on a state object. 
You write `setter` functions either as properties of a global object-literal export, or 
as individual function exports, which might be easier for testing.

```typescript
// A basic setter example
export function MY_SETTER(todos) {
    return { "todos": todos }; // or ES6: return ({ todos })
}
```
In this example, `todos` will be used to create and write to the state property `State.todos`. 

### `Application State`
Your `Application State` is an object representing your application at a point in time.
* Can be interacted with via {getState, dispatch, subscribe} methods
* You can override an initial state value of null by supplying default arguments (not recommended!)


## Explanation 
### What is (are?) `Raph's Ducks`?
    A(nother) redux-inspired publish/subscribe state-management system. 
* Defines a unique or shared State object, to which any component can subscribe for changes
* Uses a familiar `dispatch`, `getState`, and `subscribe` API for notifying of update, checking current state, and, listening to state updates, respectively
* Includes a `create` method for instantiating the state

### How is it different from Redux?
_Raphsducks_ is a very lightweight library that allows you to instantiate a state and subscribe to/unsubscribe from it. After a dispatch, it passes a copy of the updated state to subscribers. I realize this doesn't answer the question, so I'll say it's probably smaller and easier to reason about.


### Why did you choose that name?
    I didn't.             ( ._.)


### Does this need React or Redux?
    Nope
Although it was inspired by using React, and learning patterns from Redux, this is _hilariously_ unrelated to both. It was directly inspired by [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"). 

### Can I use this in React?
    Yes, using the HOC/provider pattern:
1. Create a `WrapperComponent` to handle subscribing and unsubscribing from the `State`
2. `WrapperComponent` uses a `mapPropsToState` function to copy the parts of `State.getState()` that it cares about to its internal state
3. On update, `WrapperComponent` checks if the "interesting" parts of `State.getState()` have changed
4. If so, `WrapperComponent` updates and supplies props to the wrapped component
5. Export dependants as `WrapperComponent(MyDependantComponent, mapPropsToState)`

### Why not just use redux?
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 
* ...You're right. Why _not_ just use redux?

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with multiple application files, so I built this. As with many modern JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.


## Development
    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

Run tests:
    `npm test`