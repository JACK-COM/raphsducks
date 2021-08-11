# Raph's Ducks v.0.6.x

> **IMPORTANT:** version `0.6.0` simplifies the library and introduces breaking changes.
> If you're looking for the old documentation [look here](README_v-041.md). And, let me say,
> I am _so sorry_ you ever had to deal with the old library.


Sweet merciful heavens; not _another_ State Manager...

But you would be right. And if it isn't the simplest state-manager you have ever encountered,
I'll ... I'll eat my very javascript. 

## Table Of Contents
* [Installation](#installation)
* [Usage](#usage)
* [Reference/API](#reference)
* [Terminology](#terminology)
    * [Listener Functions](#listener-functions)
    * [Setter Functions](#setter-functions)
    * [Application State](#application-state)
* [FAQs](#ifaqs-infrequently-asked-questions)
* [Development](#development)

## Installation
    npm i -s @jackcom/raphsducks

## Usage - Core Concepts

Usage is as easy as (1, 2)!
### 1. Define and instantiate your state in one smooth move
The library exports a single function, `createState`. Under the hood, this returns an
`ApplicationState` class which
    * Turns every state property into a **setter function**, and
    * Provides additional functions for reading or subscribing to that state

```typescript
    // File: MyApplicationState.js

    import createState from '@jackcom/raphsducks';

    // State definition hapens here. The object-literal you pass in is your state.
    const myAppState = createState({
        todos: [],
        someOtherValue: false,
    });

    // And that's it; now you have an instance with methods "todos" and 
    // "someOtherValue", which you can subscribe to.
    export default myAppState;
```

### 2. Use your `state` in a file (or application component, or, you know, wherever)
```typescript
    // MeanwhileAtAComponentFactory.js

    import myAppState from './path/to/MyApplicationState.js';

    // Every key in your 'createState' config becomes a method, so you can update one:
    myAppState.todos([{ text: "Pet the cat", done: false }]);

    // or multiple, if you passed them into "createState"
    myAppState.multiple({
        todos: [{ text: "Pet the cat", done: false }],
        someOtherValue: true
    });

    // And you can read the state using a vaguely familiar api: 
    // (NOTE: typescript is NOT required, and is only used for illustrative purposes)
    const { todos: Todos[], someOtherValue: Boolean } = myAppState.getState();

    console.log(todos, someOtherValue); // [{ text: "Pet the cat", done: false }], true
```

> **NOTE:**: Don't use uninstantiated keys at runtime, or you will get an error! Given our example
> above, the following will fail since it wasn't in `createState`:
> ```javascript
> myAppState.multiple({ justAddedThisOne: true })
> ```

## Usage - Other Concepts

You don't *need* to subscribe to your `state` instance in order to either read from or write to it. 
However, if you want to be automatically notified when the state changes, you can subscribe to the 
instance:
```typescript
    // Subscription returns an "unsubscribe" function, which can be used in a component lifecycle
    const unsubscribe = myAppState.subscribe((appState) => {
        // appState.todos === [{ text: "Pet the cat", done: false }]
        // appState.someOtherValue === false
    }); 

    // ... more of your zen-inducing code ensues ...

    // Eventually, when done: unsubscribe this component/subscriber from myAppState updates.
    unsubscribe(); 
    
    // If you are REALLY done and want to go one step further, you can reset. It should be used 
    // strategically on an application level. 
    myAppState.reset();

    console.log(myAppState.getState()); // { todos: [], someOtherValue: false }
```


## Reference
### **createState**
* Default Library export: Creates a new `state`  using the supplied initial state. Parameters:
  * **Args**: An object-literal representing every key and initial/default value for your global state.
  * **API**:
    ```typescript
    createState(state: { [x:string]: any }): ApplicationState
    ```
  * **Returns**: an initial [State](#application-state "Application State") with keys reflecting all keys in the initial state.


### **ApplicationState** (Class)

* State instance returned from `createState({ ... })`. `ApplicationState` has the following methods:
* `subscribe(listener)`
  * Subscribes the provided [`listener`](#listener-functions) when state changes
  * **Returns**: a function to unsubscribe from state changes

* `getState()` 
  * **Returns**: (copy of) current state

* `reset()` 
  * Resets the state to whatever was passed into `createState()`


## Terminology

### `Listener Functions`
A `listener` is a user-defined function that reacts to state updates. It takes two arguments: 
* `state: { [x:string]: any }`: the updated `state` object. 
* `updatedItemKeys: string[]`: a list of keys (`state` object properties) that were just updated. 
    
```typescript
    // A basic Listener receives the updated application state
    function myStateListener(updatedState: object, updatedItemKeys: string[]) => {
        // You can compare if your property changed
        if (updatedState.someProperty === myLocalStateCopy.someProperty) return; 

        // or use the provided keys for convenience
        if (!updatedItemKeys.includes("someProperty")) return;

        else ...
        // `state.someProperty` changed: do something with it! Be somebody!
    };
```


### **Setter Functions**
A *setter function* is just a function that *sets* a property on the state. In `v.0.5.x` and below,
library users had to define these, along with `Actions` and all sorts of horrid things. Starting 
from `v.0.6.x`, your `ApplicationState` instance will generate setter functions for you, based on
what you pass into `createState`. 


### **Application State**
Your `Application State` is a snapshot of your application at a point in time. The `ApplicationState` 
class (defined in and used by this library) is an abstraction of the concept. 

## iFAQs (Infrequently Asked Questions) 
### What is (are?) `Raph's Ducks`?
    A publish/subscribe state-management system: originally inspired by Redux, but now hyper-simplified.

### How is it similar to Redux?
* Defines a unique, shareable Application State, which can be subscribed to for updates
* Includes a `createState` method for instantiating the state
* Uses a familiar `getState`, and `subscribe` API for getting a copy of current state, and listening to state updates, respectively.

### How is it different from Redux?
* No `Actions`.
* No `dispatchers`

_Raphsducks_ is a very lightweight library that mainly allows you to instantiate a global state and 
subscribe to/unsubscribe from it. It doesn't do any additional work to make that state global: it
just gives you a state to do what you will. I *could* say it's smaller and easier to reason about -- but that would be conjecture.


### Why did you choose that name?
    I didn't.             ( ._.)


### Does this need React or Redux?
    Nope
It was inspired when I was learning React, and learning patterns from Redux. The first implementation came directly from [Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"). Dan Abramov, if you're not immediately familiar, created the *Redux* library. 

### Can I use this in [React, Vue, Svelte ... ]?
    Yes.

This is, ultimately, a plain JS object. You can use it anywhere you can use JS and need a global/application state.

### Why not just use redux?
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with multiple application files, so I built this. As with many modern JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.


## Development

All dependencies are defined in the `package.json` file: mainly Babel and Webpack for bundling.

    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

Run tests:
    `npm test`