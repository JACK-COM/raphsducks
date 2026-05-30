# Raph's Ducks v3

- A simple Javascript state manager.
- API is based on the Redux core
  - Subscribe to state with `subscribe` (returns an unsubscription function)
  - Get a copy of current state with `getState`
  - NO REDUCERS! Just update the key(s) you want with the data you expect.
- Can be used in a NodeJS backend, or with any UI library (React, Vue, Svelte, etc)

This library can be used alone, with or without a UI framework, and in combination with other state managers. Here's what you do:

1) Define a state, and
2) Use it.

If it isn't the simplest state-manager you have ever encountered, I'll ...\
I'll eat my very ~~javascript~~ typescript.

---

- [Raph's Ducks v3](#raphs-ducks-v3)
  - [Installation](#installation)
  - [Quick start](#quick-start)
  - [Define your state](#define-your-state)
    - [Use TypeScript](#use-typescript)
  - [Update your state instance](#update-your-state-instance)
  - [Subscribe to state updates](#subscribe-to-state-updates)
    - [Disposable subscriptions](#disposable-subscriptions)
    - [Tactical Subscriptions](#tactical-subscriptions)
      - [Listen for ANY change to specific keys](#listen-for-any-change-to-specific-keys)
      - [Listen for SPECIFIC CHANGES to specific keys](#listen-for-specific-changes-to-specific-keys)
  - [Preserving state](#preserving-state)
    - [LocalStorage with serialize](#localstorage-with-serialize)
  - [Reference](#reference)
    - [createState](#createstate)
    - [ApplicationStore](#applicationstore)
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
  - [Release notes](#release-notes)

## Installation

```bash
npm i -s @jackcom/raphsducks
```

---

## Quick start

The following snippet is a high-level overview. If you're working with typescript, see [Use TypeScript](#use-typescript)

```ts
import createState from '@jackcom/raphsducks';

// The state instance you will actual use. 
const store = createState({
  todos: [],
  truthy: false,
  counter: 0,
  nullableString: ''
});

// 1. Update a key at a time
store.todos([ /* ... */ ]);
store.truthy(true);
store.counter(1);

// 2. Update multiple keys at a time
store.multiple({ todos: [/* ... */], counter: 4 })

// 3. Check for changes
const { counter, todos } = store.getState();

// 4. Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  const { counter, todos } = state;
  // ... do something with changes
})
```

---

## Define your state

`raphsducks` exports a single function, `createState`. Use it to create an object that you can observe or update in different ways from your state representation.

```ts
import createState from '@jackcom/raphsducks';

// An object-literal you supply for your initial state.
const initialState = {
    todos: [],
    truthy: false,
    counter: 0,
    nullableString: ''
}

// Your state instance (for subscribing and updating the initial state).
const store = createState(initialState);

// (OPTIONAL) export for use in other parts of your app
export default store;
```

> [!NOTE]
> A typescript key initialized with `null` will _always_ expect `null` as an update value. To limit type assertion errors, use `<type> | null` for falsy types.
>
> Example: `{ myString: '' as string | null }` eliminates type errors when you call `store.myString(null)`.
>
> This is not an issue if you are using vanilla JavaScript.
  
In the example above, both `todos` and `truthy` will become functions on `store`.

### Use TypeScript

Cast object types in your initial state to avoid type assertion errors. This prevents array types from being initialized as `never[]`, and lets the instance know what keys to expect from any child objects.

- **Inline type definitions** (recommended)

  ```ts
  // A single `To do` object (e.g. for a to-do list)
  type ToDo = { title: string, description?: string, done: boolean };

  // Create an instance with your initial state. This example uses inline type
  // definitions.
  const store = createState({
      todos: [] as ToDo[], // require an array of `ToDo` objects
      truthy: false, // boolean (inferred)
      counter: 0, // number (inferred)
      nullableString: '' as string | null // will allow `null` for this key
  });
  ```

- **Initial State Type Definition**

  You can optionally create a type definition for the entire state.
  This is not recommended because you need to update the type and the initial state object.

  - **Example 1**: Type-cast your initial state to get TS warnings for missing properties.

    ```ts
    // IMPORTANT: Use "<value> || null" for falsy values.
    type MyState = {
      todos: { title: string, value: boolean }[];
      truthy: boolean;
      counter: number;
      nullableString: string | null;
    };
    
    const initialState: MyState = { 
      todos: [],
      truthy: false,
      counter: 0,
      nullableString: null
    };

    const store = createState(initialState);
    ```

  - **Example 2**: Type-cast the `createState` function itself

    ```ts
    type MyState = {
      todos: { title: string, value: boolean }[];
      truthy: boolean;
      counter: number;
      nullableString: string;
    };

    const store = createState<MyState>( /* initialState */ );
    store.truthy("A string"); // TS Error: function expects boolean
    ```

## Update your state instance

You can update one key at a time, or several at once. In TypeScript, the value type is expected to be the same as the initial value type in state. Other types can usually be inferred.

```ts
// Ex. 1: Update one key at a time
// Notify subscribers that "todos" was changed
store.todos([{ title: "Write code", value: true }]); 

// Notify subscribers that "truthy" was changed
store.truthy(false); 

// Ex. 2: Update several keys at once. Subscribers are notified once per 'multiple' call.
// Notify subscribers that "truthy" and "todos" were changed
store.multiple({
    todos: [{ title: "Write code", value: true }],
    truthy: true,
}); 
```

> [!WARNING]
> Update object properties carefully (e.g. merge `Array` properties before supplying them in `args`). The library
> overwrites key values with what you provide.

```ts
// Updating an array property (CORRECT WAY)
const oldTodos = store.getState().todos
const newTodos = [...oldTodos, { title: "New task", value: false }]

store.multiple({
    todos: newTodos,
    truthy: true,
});
```

---

## Subscribe to state updates

Your state subscriber (or _listener_) takes two values: the updated `state` values, and a list of just-updated state property names.

1. The updated `state` object-literal.
2. list of keys that were just updated.

Every subscription returns an `unsubscribe` function. Use this to stop listening for updates, or to clean up when a frontend component is removed from the DOM.

```ts
// An example local reference for the values you want from state
let myTodos = [];

// Create an unsubscriber by subscribing to a state instance
const unsubscribe = store.subscribe((state, updatedKeys) => {
    // Check if a value you care about was updated.
    if (updatedKeys.includes("todos")) myTodos = state.todos
});

// stop listening to state updates
unsubscribe();
```

`state.subscribe()` listens to _every change_ that happens to your state. However, you may have to check the updated object to see if the new state has the values you want.

There are other ways to subscribe to your state instance. Some of them allow you to guarantee what _values_ should be in state before calling your listener.

### Disposable subscriptions

[`subscribeOnce`](#applicationstore) allows you to listen until a specfic key (or any key) is updated. It will auto-unsubscribe after calling your listener.

- **Listen for only the next state update**

  Wait for the next state update to trigger an action, regardless of what gets updated:

  ```ts
  const unsubscribe = store.subscribeOnce(() => {
      doSomethingElse();
  });

  // Cancel the trigger by unsubscribing:
  unsubscribe(); // 'doSomethingElse' won't get called.
  ```

- **Subscribe only once to a specific key**

  Listen until a specific item gets updated. The value is guaranteed to be on the updated state object. This example uses a `state.todos` array:

  ```ts
  const unsubscribe = store.subscribeOnce((state) => {
      const todos = state.todos;
      doSomethingWith(todos);
  }, 'todos');

  // You can pre-emptively skip the state-update by unsubscribing first:
  unsubscribe(); // 'doSomethingElse' won't get called when state updates
  ```

- **Subscribe once to a specific value**

  Listen until a specific item gets updated with a _a specific value_.\
  The value is guaranteed to be on the updated state object. We'll use `state.counter` for our example.

  ```ts
  const unsubscribe = store.subscribeOnce(
    // `state.counter` >= 3 here because of the extra parameters below.
    // This gets called once.
    ({ counter }) => doSomethingWith(counter), 

    // tell us when "state.counter" changes
    'counter', 

    // only call the listener if "state.counter" is 3 or greater
    (count) => count >= 3 
  );

  // Pre-emptively skip the state-update by unsubscribing first:
  unsubscribe(); // 'doSomethingElse' won't get called when state updates
  ```

### Tactical Subscriptions

Use `subscribeToKeys` to listen for updates to specific keys.

#### Listen for ANY change to specific keys

Trigger updates whenever your specified keys are updated.
_At least one_ value is guaranteed to be present, because the state object can be updated in any order by any part of your app.

```ts
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

> [!Note]
> BOTH values will be present if your app does a `store.multiple( ... )` update that includes both keys.

#### Listen for SPECIFIC CHANGES to specific keys

You can mitigate uncertainty by providing a value-checker. While it doesn't guarantee that your keys will be present, you may at least ensure that the keys have the values you want on them.

```ts
const unsubscribe = store.subscribeOnce(
  // LISTENER: Run this when state.todos and/or state.counter is changed
  (state) => {
    // EITHER "todos" OR "counter" may be undefined. At least one key
    // is guaranteed to be present.
    const {todos, counter} = state;
    // If "todos" is present, it will have more than 3 todos (see VALUE-CHECKER below) 
    if (todos) doSomethingWith(todos);
    // If "counter" is present, it will be >= 3 (see VALUE-CHECKER below) 
    if (counter) doSomethingElseWith(counter);
  }, 

  // KEYS: listen for changes to "state.counter" OR "state.todos"
  ['todos', 'counter'], 
  
  // VALUE-CHECKER: make sure the keys have specific values
  (key, value) => {
    // call LISTENER only when "state.counter" changes to 3 or greater
    if (key === "counter") return value >= 3; 
    
    // call LISTENER when state has more than 3 todos added
    if (key === "todos") return value.length > 3; 
  } 
);

// Pre-emptively skip the state-update by unsubscribing first:
unsubscribe(); // 'doSomethingElse' won't get called when state updates
```

## Preserving state

Since this is an unopinionated library, you can preserve your state data in any manner that best-fits your application. The `.getState()` method returns a plain Javascript Object, which you can `JSON.stringify` and write to `localStorage` (in a browser) or to some database or other logging function. The `ApplicationStore` class now provides a `serialize` method that returns a string representation of your state:

```ts
store.serialize(); // JSON string: "{\"counter\": 0 ... }"
```

Of course, this is only useful if your objects are serializable. If you store complex objects with their own methods and such -- and you _can_ -- this will not preserve their methods.

### LocalStorage with serialize

```ts
// EXAMPLE: save and load user state with localstorage
localStorage.setItem("user", store.serialize()); // save current state

// EXAMPLE Load app state from localstorage
const stateStr = localStorage.getItem("user");
if (user) store.multiple(JSON.parse(stateStr));
```

You can use the return value of `serialize` wherever it makes the most sense for your app.

---

## Reference

### createState

```ts
  createState(state: { [x:string]: any }): ApplicationStore
```

- Default Library export. Creates a new `state` instance using the supplied initial state.\
  Parameters:
  - `initialState`: Your state-representation (an object-literal representing every key and initial value for your global state).
- **Returns**: a [state instance](#applicationstore "ApplicationStore").

---

### ApplicationStore

State instance returned from `createState()`. View full API and method explanations in [API](/readme-pages/API.md).

```ts
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

An [`ApplicationStore`](#applicationstore) instance with full subscription capabilities. This is distinct from your [_**state representation**_](#state-representation).

> [!TIP]
> The `Store` manages your `state representation`.

---

### State Representation

The plain JS object literal that you pass into `createState`.\
This object IS your application _state_: it contains any properties you want to track and update in an application. You manage your **state representation** via the [`Store Instance`](#store-instance).

---

### Listener Functions

A `listener` is a function that reacts to state updates. It expects one or two arguments:

- `state: { [x:string]: any }`: the updated `state` object.
- `updatedItems: string[]`: a list of keys (`state` object properties) that were just updated.

---

#### Example Listener

A basic Listener receives the updated application state, and the names of any changed properties, as below:

```ts
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

- Serialize data and/or interact with other storage mechanisms (e.g. `localStorage` or `sessionStorage`).
- Prevent you from implementing any additional storage mechanisms
- Conflict with any other state managers

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

- You can define a unique, shareable, subscribable Application State
- Uses a `createState` function helper for instantiating the state
- Uses `getState`, and `subscribe` methods (for getting a copy of current state, and listening to updates).
  - `subscribe` even returns an unsubscribe function!

---

### How is it different from Redux?

- **You can use it in a pure NodeJS environment**
- No `Actions`, `dispatchers`, or `reducers`
- You can use with any UI framework like ReactJS, SvelteJS, or Vue
- ~~No serialization~~ You can request the current state as a JSON string, but the instance doesn't care what you do with it.

### 1. Why did you choose that name?

```plaintext
I didn't. But I like it.
```

---

### 2. Does this need React or Redux?

```plaintext
Nope
```

This is a UI-agnostic library, hatched when I was learning React and (patterns from) Redux. The first implementation came directly from [(redux creator) Dan Abramov's egghead.io tutorial](https://egghead.io/courses/getting-started-with-redux "Getting started with Redux"), and was much heavier on Redux-style things. Later iterations became simpler, eventually evolving into the current version.

---

### 3. Can I use this in [React, Vue, Svelte ... ]?

```plaintext
Yes.
```

This is just a JS class. It can be restricted to [a single component](/readme-pages/USAGE.md#usage---examples), or used for an entire UI application, or even in a command line program. I have personally used it in NodeJS projects, as well as to pass data between a React App and JS Web Workers.

_No restrictions; only Javascript._

For a ReactJS example, see [ReactJS State Subscription via useEffect](./readme-examples/README-REACTJS.md). For usage with VueJS, see [VueJS mixin example](./readme-examples/README-VUEJS.md)

---

### 4. Why not just use redux?

```plaintext
Because this is

1. Smaller 
2. Simpler to learn
3. Simpler implement
```

- ~~Because _clearly_, Javascript needs MOAR solutions for solved problems.~~
- Not everyone needs redux. Not everyone needs _raphsducks_, either
- In fact, _not everyone needs state_.

Redux does a good deal more than _raphsducks_'s humble collection of lines. I wanted something lightweight with a pub/sub API.

---

### 5. Anything else I should know?

- Keep your state simple.
  - For example, put user info in one state, and user-created content (such as blog posts, or a shopping cart) in another. This keeps your updates zippy, and limits the number of subscribers to each state instance.
- Only subscribe when you need to.
  - Use `getState` to read and act upon state values. Subscribe when you need to respond to a state update (for example, changing a UI value, or triggering some other action).
- As with many JS offerings, I acknowledge that it _could be_ the result of thinking about a problem wrong: use at your discretion.

## Development

The core class remains a plain JS object, now with a single external dependency:

- In `v2`, the library added `rxjs`.
- In `v3`, `rxjs` was replaced with `ImmutableJS`

```bash
$. git clone <https://github.com/JACK-COM/raphsducks.git> && npm install
```

Run tests:

```bash
$. npm test
```

## Release notes
>
> - Version `1.X.X` simplifies the library and introduces breaking changes.
> If you're looking for the `0.X.X` documentation (I am _so sorry_), [look here](/README-v-0XX.md),
> - Version `1.1.X`
>   - Adds `typescript` support
>   - Adds new `subscribeOnce` function
> - Version `2.X.X`
>   - Introduces `rxjs` under the hood
>   - Updates `subscribeToKeys`
> - Version `3.X.X`
>   - Replaces `rxjs` with `immutablejs` for maximum profit
>
