# Raph's Ducks
Sweet merciful heavens; not _another_ State Manager...

## Table Of Contents
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
    * [createState](#createState(setters))
    * [createSetterActions](#createSetterActions(setters))
    * [StateInstance.dispatch()](#dispatch(...actions))
    * [StateInstance.subscribe()](#subscribe(listener))
    * [StateInstance.getState()](#getState())
* [Terms](#terminology)
    * [Actions](#actions)
    * [Listener Functions](#listener-functions)
    * [Setter Functions](#setter-functions)
    * [Setter Action Functions](#setter-action-functions)
    * [(Application) State](#application-state)
* [Explanation](#explanation)
* [Development](#development)

## Installation
    npm i --save @jackcom/raphsducks

## Quick Usage
### 1. Export your `state` and `setter actions`
Check out the [Terminology](#terminology) section for a glossary of terms
```typescript
    // File: MyApplicationState.js

    // Import these two functions from the library
    import { createState, createSetterActions } from '@jackcom/raphsducks';

    /*
     * 1. This is a "Setter Function". It sets a single property on your state.
     */
    function setToDos(todos) {
        return { todos: todos };
    }

    /* 
     * 2. Combine one or more Setters into an object literal:
     * you can also use the default object from 'import * as Variable',
     * as long as all items in '*' are setters 
     * */
    const mergedSetters = { setToDos };
    
    /*
     * Use your setters to create a State instance, 
     */
    const AppState = createState(mergedSetters);
    /*
     * (optional) You can also create an "Actions" dictionary,
     * which can be used in a `dispatch` to tell the State what to update.
     */
    const Actions = createSetterActions(mergedSetters);

    /*
     * 3. Finally, export objects where needed!
     */
    export AppState;
    export Actions;

```

### 2. Use your `state` in a file (or application component, or, you know, wherever)
```typescript
    // MeanwhileAtAComponentFactory.js

    // Import AppState
    import { AppState, Actions } from './path/to/MyApplicationState.js';

    /*
     * 1. This is a Listener Function. It listens for updates to state. 
     * In a ReactJS app, it could be a wrapper component method that triggers `setState`
     */ 

    /* const, this. */toDosListener = (updatedState) => {
        if (!updatedState.todos) return; // stop if prop hasn't initialized
        // call updater e.g. this.setState({ toDos: [...updatedState.todos] });
    };

    /*
     * 2. Create an `unsubscribe` function by subscribing to state with your listener
    */ 
    
    /* const, this.  */unsubscribe = subscribe(stateListener); 

    // 3. Use it to unsubscribe when done
    unsubscribe();

    /*
     * That's it! You can also do some other neat things, like
     * 1. Update one or more values by calling `dispatch`
    */ 
    dispatch(
        Actions.setToDosAction(numericProperty + 1),
        Actions.setAStatePropertyAction(someProperty)
    );
    
    /*
     * 2. Get values by calling `getState`
    */ 
    AppState.getState().todos; // returns (whatever you dispatched to State.todos)
```


## API
### `createState(setters)`
* Creates a new `state`  using the supplied [setters](#setter-functions). Parameters:
    * `setters`: an object with string keys and function values.
* Returns: an initial [State](#application-state "Application State") with keys reflecting all supplied setters, and initial values of null

### `createSetterActions(setters)`
* Creates an object  using the supplied [setters](#setter-functions). Parameters:
    * `setters`: an object with string keys and function values.
* Returns: an object with keys matching each setter name with the word "Action" appended 
    * (i.e. a setter fn `setUser` yields the action fn `setUserAction`)
    * Agnostic to source name: the setter fn `setUserAction` yields the action fn `setUserActionAction`)

### `State.dispatch(...actions)`
* Uses the supplied `actions` to update state. Parameters: 
    * `action`: an object literal with a `type` and `payload` property. See [Actions](#actions "Actions")
* Returns `void`

### `State.subscribe(listener)`
* Listens for state modifications and creates an 'unsubscription' function
* Call [listener()](#listener-functions) when state changes
* Returns a function to unsubscribe from state changes

### `State.getState()` 
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
### Clone and install
    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

### Build
    npm run build

### Testing (Jest)
    npm test