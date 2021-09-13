# Raph's Ducks v.1.x.x

> **UPDATES:** 
> * Version `1.x.x` simplifies the library and introduces breaking changes.
> If you're looking for the old documentation [look here](/README-v-0XX.md). And, let me say,
> I am _so sorry_ you ever had to deal with the old library.
> * Version `1.1.x` adds typescript support, and a new `subscribeOnce` function (see below)

## Table Of Contents
* [Installation](#installation)
* [Usage](#usage---core-concepts)
  * [Core Concepts](#usage---core-concepts)
  * [Working with Types](#usage---property-type-assertions)
  * [Examples (Vue, React)](#usage---examples)
* [Reference/API](#reference)
* [iFAQs](#ifaqs-infrequently-asked-questions)
* [Development](#development)

## What is it?
* A simple Javascript state manager. 
* API is based on the Redux core (i.e. includes familiar functions like `subscribe` and `getState`), but without reducers and other complexities
* Framework agnostic; can be used with any UI library (React, Vue, Svelte, etc)

If it isn't the simplest state-manager you have ever encountered,I'll ...\
I'll eat my very ~~javascript~~ typescript. 

## Installation
    npm i -s @jackcom/raphsducks

## Usage Overview
This library can be used singly, or in combination with other state managers. It aims to allow the following with limited overhead: 
1) Define a state, and 
2) Use it.


```typescript
/* MyApplicationStore.js */ 
import createState from '@jackcom/raphsducks';

// This is just an example used in the instantiation below
type Todo = { title: string, value: boolean };

// State definition: the object-literal you supply is your initial state.
const store = createState({
    // Cast array types to prevent type assertion errors at compile time:
    todos: ([] as Todo[]),
    // Other types can be inferred
    someOtherValue: false,
    someCounter: 0
});

// Update one key. Make sure the value matches the initialization param
store.todos([{ title: "Write code", value: true }]);

// Update multiple keys at once:
store.multiple({
    todos: [{ title: "Write code", value: true }],
    someOtherValue: true,
});

// Subscribe for updates and receive an unsubscribe function
const unsubscribe = store.subscribe((state, updatedKeys) => {
    let myTodos;

    if (updatedKeys.includes("todos")) {
        myTodos = state.todos
    }
})

// stop listening to state updates
unsubscribe()

// (OPTIONAL) export for use in other parts of your app
export default store;
```
The library exports a single function, `createState`.\
When called, this returns an `State` instance, which
  * Turns every state property into a **setter function**, and
  * Provides additional functions for reading or subscribing to that state
  
In the example above, both `todos` and `someOtherValue` will become functions on `store`. See [usage here](/readme-pages/USAGE.md)

> <b style="color:#C03">Important!</b> To prevent type assertion errors, make sure you initialize your keys with a corresponding type. (i.e. a key initialized with `null` will *always* expect `null` as an update value)

## What does it NOT do?
This is a purely in-memory state manager: it does NOT 
* Serialize data and/or interact with other storage mechanisms (e.g. `localStorage` or `sessionStorage`). 
* Prevent you from implementing any additional storage mechanisms
* Conflict with any other state managers


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

* State instance returned from `createState()`. View full API and method explanations [here](/readme-pages/API.md).
    ```typescript
    class ApplicationStore {
        getState(): ApplicationState;
        
        multiple(changes: Partial<ApplicationState>): void;
        
        reset(clearSubscribers?: boolean): void;
        
        subscribe(listener: ListenerFn): Unsubscriber;
        
        subscribeOnce(
            listener: ListenerFn,
            key: string,
            valueCheck?: (some: any) => boolean
        ): void;

        subscribeToKeys(
            listener: ListenerFn,
            keys: string[],
            valueCheck?: (key: string, expectedValue: any) => boolean
        ): Unsubscriber;

        // This represents any key in the object passed into 'createState'
        [x: string]: StoreUpdaterFn | any;
    }
    ```
### `Listener Functions`
A `listener` is a function that reacts to state updates. It expects one or two arguments: 
* `state: { [x:string]: any }`: the updated `state` object. 
* `updatedItems: string[]`: a list of keys (`state` object properties) that were just updated. 

#### Example Listener
A basic Listener receives the updated application state, and the names of any changed properties, as below:
```typescript
    function myListener(updatedState: object, updatedItems: string[]) => {
        // You can check if your property changed
        if (updatedState.todos === myLocalStateCopy.todos) return; 

        // or just check if it was one of the recently-updated keys
        if (!updatedItems.includes("todos")) return;

        // `state.someProperty` changed: do something with it! Be somebody!
        this.todos = updatedState.todos;
    };
```

You can define your `listener` where it makes the most sense (i.e. as either a standalone function or a method on a UI component)

---
## Deprecated Versions

Looking for something? Some items may be in [`v.0.5.x` documentation](/README-v-0XX.md), if you can't find them here. Please note that any version below 1.X.X is very extremely unsupported, and may elicit sympathetic looks and "tsk" noises.

---
## iFAQs (Infrequently Asked Questions) 
### What is (are?) `Raph's Ducks`?
    A publish/subscribe state-management system: originally inspired by Redux, but now hyper-simplified.

### How is it similar to Redux?
* Defines a unique, shareable, subscribable Application State
* Uses a `createState` function helper for instantiating the state
* Uses `getState`, and `subscribe` methods (for getting a copy of current state, and listening to updates).
  * `subscribe` even returns an unsubscribe function!

### How is it different from Redux?
* No `Actions`.
* No `dispatchers`
* No `reducers`

_Raphsducks_ is a very lightweight library that mainly allows you to instantiate a global state and subscribe to changes made to it, or subsets of it.\
You can think of it as a light cross between [Redux](https://www.npmjs.com/package/redux) and [PubSub](https://www.npmjs.com/package/pubsub-js). Or imagine those two libraries got into a fight in a cloning factory, and some of their DNA got mixed in one of those vats of mystery goo that clones things. 



### 1. Why did you choose that name?
    I didn't. But I like it.
---
### 2. Does this need React or Redux?
    Nope
This is a UI-agnostic library, hatched when I was learning React and (patterns from) Redux. The first implementation came directly from [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"), and was much heavier on Redux-style things. Later iterations became simpler until the current version evolved.

 Dan Abramov, if you're not immediately familiar, created the *Redux* library.


---
### 3. Can I use this in [React, Vue, Svelte ... ]?
    Yes.

*No restrictions; only Javascript*
---
This is, ultimately, a plain JS object. You can use it anywhere you can use JS and need a dynamic in-memory state. It can be resricted to a single component, or used for an entire application. See the [examples for UI frameworks](/readme-pages/USAGE.md#usage---examples).

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