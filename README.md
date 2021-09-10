# Raph's Ducks v.1.x.x

> **UPDATES:** 
> * Version `1.x.x` simplifies the library and introduces breaking changes.
> If you're looking for the old documentation [look here](/README-v-0XX.md). And, let me say,
> I am _so sorry_ you ever had to deal with the old library.
> * Version `1.1.x` adds typescript support

## What is it?
* A simple Javascript state manager. 
* API is based on the Redux core (i.e. includes familiar functions like `subscribe` and `getState`), but without reducers and other complexities
* Framework agnostic; can be used with any UI library (React, Vue, Svelte, etc)

If it isn't the simplest state-manager you have ever encountered,I'll ...\
I'll eat my very ~~javascript~~ typescript. 

## Example Usage
```typescript
/* MyApplicationStore.js */ 
import createState from '@jackcom/raphsducks';

// State definition: the object-literal you pass in is your state.
const store = createState({
    todos: [],
    someOtherValue: false,
});

// (OPTIONAL) export for use in other parts of your app
export default store;
```
The library exports a single function, `createState`.\
When called, this returns an `State` instance, which
  * Turns every state property into a **setter function**, and
  * Provides additional functions for reading or subscribing to that state
  
In the example above, both `todos` and `someOtherValue` will become functions on `store`. See [usage below](#usage---core-concepts)
## What does it NOT do?
This is a purely in-memory state manager: it does NOT 
* Serialize data and/or interact with other storage mechanisms (e.g. `localStorage` or `sessionStorage`). 
* Prevent you from implementing any additional storage mechanisms
* Conflict with any other state managers

## Table Of Contents
* [Installation](#installation)
* [Usage](#usage---core-concepts)
* [Reference/API](#reference)
* [iFAQs](#ifaqs-infrequently-asked-questions)
* [Development](#development)

## Installation
    npm i -s @jackcom/raphsducks

## Usage - Core Concepts

Usage is as easy as (1)!
### 1. Use your `state` in a file (or application component, or, you know, wherever)
```typescript
    // SomewhereInAComponent.js
    import store from './path/to/MyApplicationStore.js';

    // 1a) Update one key at a time:
    store.todos([{ title: "Write code", value: true }]);
    store.someOtherValue(true);
    // 1b) Update multiple keys at once:
    store.multiple({
        todos: [{ title: "Write code", value: true }],
        someOtherValue: true,
    });

    // 2. Check current state
    const currentState = store.getState();

    // 3. Subscribe for updates: optionally use 'updatedKeys' to restrict local updates
    //    Calling 'instance.subscribe( ... )' returns an 'unsubscriber' function
    const localUnsubscribe = store.subscribe((updatedState, updatedKeys: string[]) => {
        let localTodos = [];

        if (updatedKeys.includes("todos")) {
            localTodos = [...updatedState.todos];
        }
    })

    // 4. stop listening to updates
    localUnsubscribe();

    // 5. Reset state to starting point (this won't remove your subscribers)
    store.reset();
```

> **NOTE:**: Don't use uninstantiated keys at runtime, or you will get an error! Given our example
> above, the following will fail since `invalidKey` wasn't in the arguments to `createState`:
> ```javascript
> store.multiple({ wellThisIsNew: true, todos: [ ... ] })
> ```

## Usage - Other Concepts

If you want to be automatically notified when the state changes, you can subscribe to the 
instance. This is useful when working in a front-end framework. See examples below.
* [React Higher Order Component (HOC)](/readme-examples/react-subscriber-hoc.md)
* [VueJS (2x, 3x) Mixin](/readme-examples/vue-subscriber-mixin.md)


## Reference
### **createState**
* Default Library export: Creates a new `state`  using the supplied initial state. Parameters:
  * **Args**: An object-literal representing every key and initial/default value for your global state.
  * **API**:
    ```typescript
    createState(state: { [x:string]: any }): ApplicationStore
    ```
  * **Returns**: a [state instance](#applicationstore-class "Application Store class"). 



### **ApplicationStore** (Class)

* State instance returned from `createState()`. 
    ```typescript
    ApplicationStore (instance) {
        // Reset all properties (except subscribers) to their original state
        reset(): void 

        // Read current state
        getState(): void 

        // Watch state instance: returns an "unsubscribe" function.
        subscribe(listener: (updates: T, updatedKeys: string[]): any | void): ():void

        // updates one or more keys at once on the instance
        multiple(updates: object) => void 

        // This represents any key you pass into `createState`  
        [K: string]: (value?: any) => void 
        
    }   
    ```
### `Listener Functions`
A `listener` is a function that reacts to state updates. It expects one or two arguments: 
* `state: { [x:string]: any }`: the updated `state` object. 
* `updatedItems: string[]`: a list of keys (`state` object properties) that were just updated. 
    
```typescript
    // A basic Listener receives the updated application state, and the names of any changed properties
    function myListener(updatedState: object, updatedItems: string[]) => {
        
        // You can check if your property changed
        if (updatedState.todos === myLocalStateCopy.todos) return; 

        // or just check if it was one of the recently-updated keys
        if (!updatedItems.includes("todos")) return;

        // `state.someProperty` changed: do something with it! Be somebody!
        this.todos = updatedState.todos;
    };
```


### Deprecated in 0.5.x

Looking for something? Some items may be in [`v.0.5.x` documentation](/README-v-0XX.md), if you can't find them here. 

## iFAQs (Infrequently Asked Questions) 
### What is (are?) `Raph's Ducks`?
    A publish/subscribe state-management system: originally inspired by Redux, but now hyper-simplified.

### How is it similar to Redux?
* Defines a unique, shareable, subscribable Application State
* Uses a `createState` function helper for instantiating the state
* Uses `getState`, and `subscribe` methods (for getting a copy of current state, and listening to updates).

### How is it different from Redux?
* No `Actions`.
* No `dispatchers`

_Raphsducks_ is a very lightweight library that mainly allows you to instantiate a global state and subscribe to/unsubscribe from it.\
It doesn't do any additional work to make that state global. 

I *could* say it's smaller and easier to reason about -- but that would be conjecture.


### 1. Why did you choose that name?
    I didn't. But I like it.
---
### 2. Does this need React or Redux?
    Nope
This is a UI-agnostic library, hatched when I was learning React and (patterns from) Redux. The first implementation came directly from [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"), and was much heavier on Redux-style things. Later iterations became simpler until the current version evolved.

 Dan Abramov, if you're not immediately familiar, created the *Redux* library.\


---
### 3. Can I use this in [React, Vue, Svelte ... ]?
    Yes.

This is, ultimately, a plain JS object. You can use it anywhere you can use JS and need a dynamic state of some kind. It can be resricted to a single component, or used for an entire application. 
### No restrictions; only Javascript.
---
### 4. Why not just use redux?
    This is much, much simpler to learn and implement.
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with opinionated patterns. 

As with many JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.


## Development

All dependencies are defined in the `package.json` file: mainly Babel and Webpack for bundling.

    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

Run tests:
    `npm test`