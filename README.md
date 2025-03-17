# Raph's Ducks v3

> **UPDATES:**
>
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
    - [Listening to your state instance](#listening-to-your-state-instance)
      - [Disposable (one-time) subscription](#disposable-one-time-subscription)
        - [Listen until the next state update](#listen-until-the-next-state-update)
        - [One-time subscription to a specific key](#one-time-subscription-to-a-specific-key)
        - [One-time subscription to a specific value](#one-time-subscription-to-a-specific-value)
      - [Tactical Subscription](#tactical-subscription)
        - [Listen for ANY change to specific keys](#listen-for-any-change-to-specific-keys)
        - [Listen for SPECIFIC VALUES on specific keys](#listen-for-specific-values-on-specific-keys)
    - [Preserving state](#preserving-state)
      - [LocalStorage with serialize](#localstorage-with-serialize)
  - [Reference](#reference)
    - [**createState**](#createstate)
    - [ApplicationStore (Class)](#applicationstore-class)
    - [Store Instance](#store-instance)
    - [State Representation](#state-representation)
    - [Listener Functions](#listener-functions)
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
    - [5. Anything else I should know?](#5-anything-else-i-should-know)
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
    somethingTruthy: false,
    counter: 0,
    nullableString: ''
}

// The state instance you will actual use. Instantiate, and you're ready to go.
const store = createState(initialState);

// (OPTIONAL) export for use in other parts of your app
export default store;
```

> <b style="color:#C63">Hint:</b> In typescript, a key initialized with `null` will _always_ expect `null` as an update value. To prevent type assertion errors, make sure you initialize your keys with a corresponding type. (e.g. `{ p: [] as string[] }`)
  
In the example above, both `todos` and `somethingTruthy` will become functions on `store`. See [usage here](#updating-your-state-instance)

#### Working with Typescript

When working with TS, you'll want to cast object types in your initial state to avoid type assertion errors. This prevents  array types from being initialized as `never[]`, and lets the instance know what keys to expect from any child objects.

##### i. inline type definitions (recommended)

```typescript
// A single `To do` object (e.g. for a to-do list)
type ToDo = { title: string, description?: string, done: boolean };

// Initial state with inline type definitions. You can supply this directly to
// `createState` unless you're (e.g.) generating it from a function
const initialState = {
    todos: [] as ToDo[], // require an array of `ToDo` objects
    somethingTruthy: false, // boolean (inferred)
    counter: 0, // number (inferred)
    nullableString: '' as string | null // will allow `null` for this key
}

// Create an instance with your state definition
const store = createState(initialState);

// update select keys
store.multiple({
   somethingTruthy: true,
   counter: 3,
}); 
// Check results
store.getState().somethingTruthy;    // true
store.getState().counter;       // 3

// Or use destructuring
const { somethingTruthy, counter} = store.getState()
console.log(somethingTruthy); // true
console.log(counter); // 3
```

##### ii. Initial State Type Definitions

You can optionally create a type-def for the entire state, though this gets
unwieldy to maintain (since you need to update the type-def along with the initial state object).
Inline definitions are recommended [(see above)](#i-inline-type-definitions-recommended).

```typescript
// IMPORTANT: DO NOT initialize properties as "undefined", or you'll never hear the end of it.
type MyState = {
  todos: ToDo[];
  somethingTruthy: boolean;
  counter: number;
  nullableString: stringl
};

// A single `To do` object (e.g. for a to-do list)
type ToDo = { title: string, value: boolean };

// OPTION 1: Type-cast your initial state to get TS warnings for missing properties.
const initialState: MyState = { ... };
const store = createState(initialState);

// OPTION 2: Type-cast the `createState` function itself
const store = createState<MyState>( /* initialState */ );

// Now you have type definitions and editor hints:
store.somethingTruthy; // (v: boolean) => void;

// And you can get typescript warnings when supplying the wrong value
store.somethingTruthy("A string"); // TS Error: function expects boolean
```

---

### Updating your state instance

You can update one key at a time, or several at once. In Typescript, the value type is expected to be the same as the initial value type in state. Other types can usually be inferred.

```typescript
// Update one key at a time
store.todos([{ title: "Write code", value: true }]); // notifies subscribers
store.somethingTruthy(false); // notifies subscribers

// Update several keys. Subscribers are notified once per 'multiple' call.
store.multiple({
    todos: [{ title: "Write code", value: true }],
    somethingTruthy: true,
}); // notifies subscribers
```

Note that `state.multiple( args )` will merge `args` into the current state instance. Make sure you update object properties carefully (e.g. merge `Array` properties before supplying them in `args`)

```typescript
// Updating an array property (CORRECT WAY)
const oldTodos = store.getState().todos
const newTodos = [...oldTodos, { title: "New task", value: false }]

store.multiple({
    todos: newTodos,
    somethingTruthy: true,
});
```

---

### Listening to your state instance

You can subscribe for updates. Your subscriber should take two values: the updated `state` values, and a list of just-updated state property names.

Every subscription returns an `unsubscribe` function. You can call it when you no longer need to listen for updates, or (for front-end apps) use it to clean up when a component is removed from the DOM.

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

`state.subscribe()` is a great way to listen to _every change_ that happens to your state, although you may have to check the updated object to see if it has the values you want.

Luckily there are other ways to subscribe to your state instance. These alternatives only notify when something you care about gets updated. Some of them allow you to even specify what _values_ you want to see in the state. See below.

> **Hint:** the `listener` handler is the same in all `subscribe` functions. It always accepts two arguments: the updated `state` object-literal, and a list of keys that were just updated.

#### Disposable (one-time) subscription

[`subscribeOnce`](#applicationstore-class) allows you to listen until a specfic key is updated (or just until the next state update happens). It will auto-unsubscribe depending on how you use it.

##### Listen until the next state update

You can wait for the next state update to trigger something else. This assumes that you don't care what is in state, as long as some other part of your application updated it.

```typescript
const unsubscribe = store.subscribeOnce(() => {
    doSomethingElse();
});

// Cancel the trigger by unsubscribing:
unsubscribe(); // 'doSomethingElse' won't get called.
```

##### One-time subscription to a specific key

Listen until a specific item gets updated, then use it. The value is guaranteed to be on the updated state object. We'll use `state.todos` in our example.

```typescript
const unsubscribe = store.subscribeOnce((state) => {
    const todos = state.todos;
    doSomethingWith(todos);
}, 'todos');

// You can pre-emptively skip the state-update by unsubscribing first:
unsubscribe(); // 'doSomethingElse' won't get called when state updates
```

##### One-time subscription to a specific value

Listen until a specific item **gets updated with a specific value**, then use it.\
As above, the value is guaranteed to be on the updated state object. We'll use `state.counter` for our example.

```typescript
const unsubscribe = store.subscribeOnce(
  // `state.counter` >= 3 here because of the extra parameters below
  (state) => {
    // no more updates after this gets triggered once
    const counter = state.counter;
    doSomethingWith(counter); 
  }, 

  // tell us when "state.counter" changes
  'counter', 

  // only call the listener if "state.counter" is 3 or greater
  (count) => count >= 3 
);

// Pre-emptively skip the state-update by unsubscribing first:
unsubscribe(); // 'doSomethingElse' won't get called when state updates
```

#### Tactical Subscription

You can target updates to very specific keys. Like `subscribeOnce`, you can refine how these updates are handled.

##### Listen for ANY change to specific keys

Trigger updates whenever your specified keys are updated. _At least one_ value is guaranteed to be present, because the state object can be updated in any order by any part of your app.

```typescript
const unsubscribe = store.subscribeToKeys(
  (state) => {
    // This will continue to receive updates for both keys until you unsubscribe
    const {todos, counter} = state; // "todos" OR "counter" may be undefined
    if (todos) doSomethingWith(todos);
    if (counter) doSomethingElseWith(counter);
  }, 
  
  // Only tell us when either of these keys changes
  ['todos', 'counter']
);

// Unsubscribe from updates when done:
unsubscribe(); 
```

**Note**: BOTH values will be present if your app does a `store.multiple( ... )` update that includes both keys.

##### Listen for SPECIFIC VALUES on specific keys

You can mitigate uncertainty by providing a value-checker. While it doesn't guarantee that your keys will be present, you may at least ensure that the keys have the values you want on them.

```typescript
const unsubscribe = store.subscribeOnce(
  // `state.counter` >= 3 here because of the extra parameters below
  (state) => {
    // "todos" OR "counter" may be undefined. If they aren't, they will meet
    // the conditions specified in our value-checker
    const {todos, counter} = state; 
    if (todos) doSomethingWith(todos);
    if (counter) doSomethingElseWith(counter);
  }, 

  // KEYS: tell us when "state.counter" OR "state.todos" changes
  ['todos', 'counter'], 
  
  // VALUE-CHECKER: make sure our keys have the values we want
  (key, value) => {
    // update only when "state.counter" is 3 or greater
    if (key === "counter") return value >= 3; 
    
    // update when state has more than 3 todos added
    if (key === "todos") return value.length > 3; 
  } 
);

// Pre-emptively skip the state-update by unsubscribing first:
unsubscribe(); // 'doSomethingElse' won't get called when state updates
```

### Preserving state

Since this is an unopinionated library, you can preserve your state data in any manner that best-fits your application. The `.getState()` method returns a plain Javascript Object, which you can `JSON.stringify` and write to `localStorage` (in a browser) or to some database or other logging function. The `ApplicationStore` class now provides a `serialize` method that returns a string representation of your state:

```typescript
store.serialize(); // JSON string: "{\"counter\": 0 ... }"
```

Of course, this is only useful if your objects are serializable. If you store complex objects with their own methods and such -- and you _can_ -- this will not preserve their methods.

#### LocalStorage with serialize

```typescript
// EXAMPLE: save and load user state with localstorage
localStorage.setItem("user", store.serialize()); // save current state

// EXAMPLE Load app state from localstorage
const stateStr = localStorage.getItem("user");
if (user) store.multiple(JSON.parse(stateStr));
```

You can use the return value of `serialize` wherever it makes the most sense for your app.

---

## Reference

### **createState**

```typescript
  createState(state: { [x:string]: any }): ApplicationStore
```

* Default Library export. Creates a new `state` instance using the supplied initial state.\
  Parameters:
  * `initialState`: Your state-representation (an object-literal representing every key and initial value for your global state).
* **Returns**: a [state instance](#applicationstore-class "Application Store class").

---

### ApplicationStore (Class)

* State instance returned from `createState()`. View full API and method explanations [here](/readme-pages/API.md).

```typescript
class ApplicationStore {
  getState(): StoreInstance;
  
  multiple(changes: Partial<StoreInstance>): void;
  
  reset(clearSubscribers?: boolean): void;

  serialize(): string;
  
  subscribe(listener: ListenerFn): Unsubscriber;
  
  subscribeOnce<K extends keyof StoreInstance>(
      listener: ListenerFn,
      key?: K,
      valueCheck?: (some: StoreInstance[K]) => boolean
  ): void;

  subscribeToKeys<K extends keyof StoreInstance>(
      listener: ListenerFn,
      keys: K[],
      valueCheck?: (key: K, expectedValue: any) => boolean
  ): Unsubscriber;

  // This represents any key in the object passed into 'createState'
  [x: string]: StoreUpdaterFn | any;
}
```

---

### Store Instance

An [`ApplicationStore`](#applicationstore-class) instance with full subscription capabilities. This is distinct from your [_**state representation**_](#state-representation).

**Hint:** the `Store` manages your `state representation`.

---

### State Representation

The plain JS object literal that you pass into `createState`.\
This object IS your application _state_: it contains any properties you want to track and update in an application. You manage your **state representation** via the [`Store Instance`](#state-instance).

---

### Listener Functions

A `listener` is a function that reacts to state updates. It expects one or two arguments:

* `state: { [x:string]: any }`: the updated `state` object.
* `updatedItems: string[]`: a list of keys (`state` object properties) that were just updated.

---

#### Example Listener

A basic Listener receives the updated application state, and the names of any changed properties, as below:

```typescript
// Assume you have a local copy of some state value here
let localTodos = [];

function myListener(newState: object, updtedKeys: string[]) {
  // You can check if your property changed
  if (newState.todos === localTodos) return; 

  // or just check if it was one of the recently-updated keys
  if (!updtedKeys.includes("todos")) return;

  // `state.someProperty` changed: do something with it! Be somebody!
  localTodos = newState.todos;
}
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

  > A publish/subscribe state-management system: originally inspired by Redux, but hyper-simplified.

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

* **You can use it in a pure NodeJS environment**
* No `Actions`, `dispatchers`, or `reducers`
* You can use with any UI framework like ReactJS, SvelteJS, or Vue
* ~~No serialization~~ You can request the current state as a JSON string, but the instance doesn't care what you do with it.

### 1. Why did you choose that name?

    I didn't. But I like it.
---

### 2. Does this need React or Redux?

    Nope
This is a UI-agnostic library, hatched when I was learning React and (patterns from) Redux. The first implementation came directly from [(redux creator) Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"), and was much heavier on Redux-style things. Later iterations became simpler, eventually evolving into the current version.

---

### 3. Can I use this in [React, Vue, Svelte ... ]?

    Yes.

This is just a JS class. It can be restricted to [a single component](/readme-pages/USAGE.md#usage---examples), or used for an entire UI application, or even in a command line program. I have personally used it in NodeJS projects, as well as to pass data between a React App and JS Web Workers.

_No restrictions; only Javascript._

---

### 4. Why not just use redux?

    Because this is MUCH simpler to learn and implement.

* ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
* Not everyone needs redux. Not everyone needs _raphsducks_, either
* In fact, _not everyone needs state_.

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with a pub/sub API. It allows me to quickly extend an application's state without getting into fist-fights with opinionated patterns.

---

### 5. Anything else I should know?

As with many JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.

## Development

The core class remains a plain JS object, now with a single external dependency:

* In `v2`, the library added `rxjs`.
* In `v3`, `rxjs` was replaced with `ImmutableJS`

```bash
$. git clone <https://github.com/JACK-COM/raphsducks.git> && npm install
```

Run tests:

```bash
$. npm test
```
