# Raph's Ducks v3

> **UPDATES:** 
> * Version `1.X.X` simplifies the library and introduces breaking changes.
> If you're looking for the `0.X.X` documentation (I am _so sorry_), [look here](/README-v-0XX.md),
> * Version `1.1.X` adds `typescript` support, and a new `subscribeOnce` function (see below)
> * Version `2.X.X` introduces `rxjs` under the hood
> * Version `3.X.X` replaces `rxjs` with `immutablejs` for maximum profit

--- 

- [Raph's Ducks v3](#raphs-ducks-v3)
  - [What is it?](#what-is-it)
  - [Installation](#installation)
  - [Usage Overview](#usage-overview)
    - [Defining your state](#defining-your-state)
      - [Working with Typescript](#working-with-typescript)
        - [i. inline type definitions (recommended)](#i-inline-type-definitions-recommended)
        - [ii. Initial State Type Definitions](#ii-initial-state-type-definitions)
    - [Updating your state instance](#updating-your-state-instance)
    - [Subscribing to your state instance](#subscribing-to-your-state-instance)
      - [Disposable (one-time) subscription](#disposable-one-time-subscription)
        - [Ad-hoc, one-time subscription](#ad-hoc-one-time-subscription)
        - [One-time subscription to a specific value](#one-time-subscription-to-a-specific-value)
  - [Reference](#reference)
    - [**createState**](#createstate)
    - [**State Instance**](#state-instance)
    - [**State Representation**](#state-representation)
    - [**ApplicationStore** (Class)](#applicationstore-class)
    - [`Listener Functions`](#listener-functions)
      - [Example Listener](#example-listener)
  - [What does it NOT do?](#what-does-it-not-do)
  - [Deprecated Versions](#deprecated-versions)
    - [Migrating from `v1x` to `v2x`](#migrating-from-v1x-to-v2x)
  - [iFAQs (Infrequently Asked Questions)](#ifaqs-infrequently-asked-questions)
    - [What is `raphsducks`?](#what-is-raphsducks)
    - [How is it similar to Redux?](#how-is-it-similar-to-redux)
    - [How is it different from Redux?](#how-is-it-different-from-redux)
    - [1. Why did you choose that name?](#1-why-did-you-choose-that-name)
    - [2. Does this need React or Redux?](#2-does-this-need-react-or-redux)
    - [3. Can I use this in \[React, Vue, Svelte ... \]?](#3-can-i-use-this-in-react-vue-svelte--)
    - [4. Why not just use redux?](#4-why-not-just-use-redux)
  - [Development](#development)


---

## What is it?
* A simple Javascript state manager. 
* API is based on the Redux core
  * Subscribe to state with `subscribe` (returns an unsubscription function) 
  * Get a copy of current state with `getState`
  * NO REDUCERS! Just update the key(s) you want with the data you expect.
* Can be used in a NodeJS backend, or with any UI library (React, Vue, Svelte, etc)

If it isn't the simplest state-manager you have ever encountered, I'll ...\
I'll eat my very ~~javascript~~ typescript. 

---
## Installation
    npm i -s @jackcom/raphsducks

---
## Usage Overview
This library can be used alone, or in combination with other state managers. Here's what you do:
1) Define a state, and 
2) Use it.

---

### Defining your state
`raphsducks` allows you to intuitively define your state once, in a single place. The libary turns your state representation into an object that you can observe or update in different ways.

The library exports a single function, `createState`.\
When called, this returns an `State` instance, which
  * Turns every state property into a **setter function**, and
  * Provides additional functions for reading or subscribing to that state
```typescript
/* MyApplicationStore.js */ 
import createState from '@jackcom/raphsducks';

// State definition: the object-literal you supply is your initial state.
const initialState = {
    todos: [],
    someOtherValue: false,
    someCounter: 0,
    someString: ''
}

// The state instance you will actual use. Instantiate, and you're ready to go.
const store = createState(initialState);

// (OPTIONAL) export for use in other parts of your app
export default store;
```

> <b style="color:#C63">Hint:</b> In typescript, a key initialized with `null` will *always* expect `null` as an update value. To prevent type assertion errors, make sure you initialize your keys with a corresponding type. (e.g. `{ p: [] as string[] }`)
  
In the example above, both `todos` and `someOtherValue` will become functions on `store`. See [usage here](#updating-your-state-instance)

#### Working with Typescript
When working with TS, you'll want to cast object types in your initial state to avoid type assertion errors. This prevents  array types from being initialized as `never[]`, and lets the instance know what keys to expect from any child objects.
 
##### i. inline type definitions (recommended)
> ```typescript
> // A single `To do` object (e.g. for a to-do list)
> type ToDo = { title: string, description?: string, done: boolean };
> 
> // Initial state with inline type definitions
> const initialState = {
>     todos: [] as ToDo[], // require an array of `ToDo` objects
>     someOtherValue: false, // boolean (inferred)
>     someCounter: 0, // number (inferred)
>     someString: '' as string | null // will allow `null` for this key
> }
> 
> const myStateInstance = createState(initialState);
> 
> // update select keys
> myStateInstance.multiple({
>    someOtherValue: true,
>    someCounter: 3,
> }); 
>
> // Check results
> myStateInstance.getState().someOtherValue;    // true
> myStateInstance.getState().someCounter;       // 3
>
> ```


##### ii. Initial State Type Definitions
**Note:** This requires you to update your state type definition *as well as* your initial state object.

You can optionally create a type-def for the entire state, though this gets
unwieldy to maintain. Inline definitions are cleaner and recommended (see above). 

> ```typescript
> // IMPORTANT: DO NOT specify optional properties on the top level, or you'll 
> // never hear the end of it.
> type MyStateTypeDef = {
>   todos: ToDo[];
>   someOtherValue: boolean;
>   someCounter: number;
>   someString: stringl
> };
>
> // A single `To do` object (e.g. for a to-do list)
> type ToDo = { title: string, value: boolean };
> 
> // USAGE 1: Type-cast your initial state to get TS warnings for missing properties.
> const initialState: MyStateTypeDef = { ... };
> const myStateInstance = createState(initialState);
>
> // USAGE 2: Cast the `createState` function to get TS warnings here.
> const myStateInstance = createState<MyStateTypeDef>( /* initialState */ );
> ```
> 


---

### Updating your state instance
You can update one key at a time, or several at once. In Typescript, the value type is expected to be the same as the initial value type in state. Other types can usually be inferred.

```typescript
// Updating one key at a time
store.todos([{ title: "Write code", value: true }]);

// Updating several keys. Subscribers are notified once per 'multiple' call.
store.multiple({
    todos: [{ title: "Write code", value: true }],
    someOtherValue: true,
});
```

Note that `state.multiple( args )` will merge `args` into the current state instance. Make sure you update object properties carefully (e.g. merge `Array` properties before supplying them in `args`)

```typescript
// Updating an array property
const oldTodos = store.getState().todos

store.multiple({
    todos: [...oldTodos, { title: "New task", value: false }],
    someOtherValue: true,
});
```

---

### Subscribing to your state instance
You can subscribe for updates and receive an `unsubscribe` function. Call it when you no longer need to listen for updates. Your subscriber should take two values: the updated `state` values, and a list of just-updated state property names. 
```typescript
const unsubscribe = store.subscribe((state, updatedKeys) => {
    let myTodos;

    // Handy way to check if a value you care about was updated.
    if (updatedKeys.includes("todos")) {
        myTodos = state.todos
    }
});

// stop listening to state updates
unsubscribe();
```

`state.subscribe()` is a great way to listen to *every change* that happens to your state. However, you will typically have to check the updated object to see if it has any values you want.\
Luckily there are other ways to subscribe to your state instance. These alternatives only notify when something you care about gets updated. Some of them allow you to even specify what *values* you want to return. 

#### Disposable (one-time) subscription
Use [`subscribeOnce`](#applicationstore-class) to listen to your state until a single value is updated (or just until the next state update happens), then auto-unsubscribe.\

> **Hint:** the `listener` handler is the same in all `subscribe` functions. It always accepts two arguments: the updated `state` object-literal, and a list of keys that were just updated.

##### Ad-hoc, one-time subscription
You can wait for the next state update to trigger something else.
```typescript
const unsubscribe = store.subscribeOnce(() => {
    doSomethingElse();
});

// Cancel the trigger by unsubscribing:
unsubscribe(); // 'doSomethingElse' won't get called.
```

##### One-time subscription to a specific value
Listen until a specific item gets updated, then use it. The value is guaranteed to be on the updated state object.\
We'll use `state.todos` in our example.
```typescript
const unsubscribe = store.subscribeOnce((state) => {
    const todos = state.todos;
    doSomethingElse(todos);
}, 'todos');

// Cancel the state-update trigger by unsubscribing:
unsubscribe(); // 'doSomethingElse' won't get called.
```

---
## Reference
### **createState**
* Default Library export. Creates a new `state` instance using the supplied initial state. Parameters:
  * **Args**: An object-literal representing every key and initial/default value for your global state.
  * **API**:
    ```typescript
    createState(state: { [x:string]: any }): ApplicationStore
    ```
  * **Returns**: a [state instance](#applicationstore-class "Application Store class"). 

---

### **State Instance**
An instance of [`ApplicationStore`](#applicationstore-class) with full subscription capability. This is distinct from your [***state representation***](#state-representation).

---

### **State Representation**
A plain JS object literal that you pass into `createState`.\
This object, for all intents and purposes, *is* your state. It should hold any properties you want to track.
You can modify/use your **state representation** via the [`State Instance`](#applicationstore-class). 

---

### **ApplicationStore** (Class)

* State instance returned from `createState()`. View full API and method explanations [here](/readme-pages/API.md).
    ```typescript
    class ApplicationStore {
        getState(): ApplicationState;
        
        multiple(changes: Partial<ApplicationState>): void;
        
        reset(clearSubscribers?: boolean): void;
        
        subscribe(listener: ListenerFn): Unsubscriber;
        
        subscribeOnce<K extends keyof ApplicationState>(
            listener: ListenerFn,
            key?: K,
            valueCheck?: (some: ApplicationState[K]) => boolean
        ): void;

        subscribeToKeys<K extends keyof ApplicationState>(
            listener: ListenerFn,
            keys: K[],
            valueCheck?: (key: K, expectedValue: any) => boolean
        ): Unsubscriber;

        // This represents any key in the object passed into 'createState'
        [x: string]: StoreUpdaterFn | any;
    }
    ```

---

### `Listener Functions`
A `listener` is a function that reacts to state updates. It expects one or two arguments: 
* `state: { [x:string]: any }`: the updated `state` object. 
* `updatedItems: string[]`: a list of keys (`state` object properties) that were just updated. 

---

#### Example Listener
A basic Listener receives the updated application state, and the names of any changed properties, as below:
```typescript
    function myListener(updatedState: object, updatedItems: string[]) {
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

## What does it NOT do?
This is a purely in-memory state manager: it does NOT 
* Serialize data and/or interact with other storage mechanisms (e.g. `localStorage` or `sessionStorage`). 
* Prevent you from implementing any additional storage mechanisms
* Conflict with any other state managers

---

## Deprecated Versions
Looking for something? Some items may be in [`v.0.5.x` documentation](/README-v-0XX.md), if you can't find them here. Please note that any version below `1.X.X` is very extremely unsupported, and may elicit sympathetic looks and "tsk" noises.

---

### Migrating from `v1x` to `v2x`
Although not exactly "deprecated", `v1.X.X` will receive reduced support as of June 2022. It is recommended that you upgrade to the `v2.X.X` libraryas soon as possible. The migration should be as simple as running `npm i @jackcom/raphsducks@latest`, since the underlying API has not changed. 

---
## iFAQs (Infrequently Asked Questions) 
### What is `raphsducks`?
    A publish/subscribe state-management system: originally inspired by Redux, but hyper-simplified.


_Raphsducks_ is a very lightweight library that mainly allows you to instantiate a global state and subscribe to changes made to it, or subsets of it.\
You can think of it as a light cross between [Redux](https://www.npmjs.com/package/redux) and [PubSub](https://www.npmjs.com/package/pubsub-js). Or imagine those two libraries got into a fight in a cloning factory, and some of their DNA got mixed in one of those vats of mystery goo that clones things. 

---

### How is it similar to Redux?
* You can define a unique, shareable, subscribable Application State
* Uses a `createState` function helper for instantiating the state
* Uses `getState`, and `subscribe` methods (for getting a copy of current state, and listening to updates).
  * `subscribe` even returns an unsubscribe function!

---

### How is it different from Redux?
* No `Actions`.
* No `dispatchers`
* No `reducers`
* No serialization
* You can use with (or without) any UI framework like ReactJS, SvelteJS, or Vue




### 1. Why did you choose that name?
    I didn't. But I like it.
---
### 2. Does this need React or Redux?
    Nope
This is a UI-agnostic library, hatched when I was learning React and (patterns from) Redux. The first implementation came directly from [(redux creator) Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"), and was much heavier on Redux-style things. Later iterations became simpler, eventually evolving into the current version. 

---
### 3. Can I use this in [React, Vue, Svelte ... ]?
    Yes.

*No restrictions; only Javascript.*\
This is, ultimately, a plain JS object. You can use it anywhere you can use JS and need a dynamic in-memory state. It can be restricted to a single component, or used for an entire UI application, or in a command line program. See the [examples for UI frameworks](/readme-pages/USAGE.md#usage---examples).

---
### 4. Why not just use redux?
    This is much, *much* simpler to learn and implement.
* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_. 

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with the pub/sub API, which would allow me to quickly extend an application's state without getting into fist-fights with opinionated patterns. 

As with many JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.


## Development

The core class remains a plain JS object. All dependencies are defined in the `package.json` file: as of `v2`, the library includes an `rxjs` dependency. 

    git clone https://github.com/JACK-COM/raphsducks.git && npm install 

Run tests:
    `npm test`