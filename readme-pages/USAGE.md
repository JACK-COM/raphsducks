# How to use *raphsducks*

## Table of Contents

* [Core Concepts](#usage---core-concepts)
  * [Creating an instance](#1-creating-your-state-instance)
  * [Using the instance](#2-using-the-state-instance)
  * [Accessing state values](#3-access-values-in-the-current-state)
* [Typescript and Type assertions](#usage---property-type-assertions)
* [Examples for VueJS and ReactJS](#usage---examples)

---

## Usage - Core Concepts

### 1. Creating your state instance

Initialize your `state` in a file (or application component, or, you know, wherever)

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

### 2. Using the state instance

Use your `state` in a file (or application component, or, you know, wherever)

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
```

### 3. Access values in the current state

#### i. Ad-hoc access

```typescript
    // a) Check current state. You can get the entire state object, 
    const currentState = store.getState(); // { todos: [...], someOtherValue: ... }
    
    // ...or deconstruct only what you need.
    const { todos } = store.getState();
```

#### ii. Access the current state via subscription

```typescript
    // Subscribe for updates: optionally use 'updatedKeys' to restrict local updates
    // Calling 'subscribe( ... )' returns an 'unsubscribe' function, which you can use
    // for cleanup
    const unsubscribe = store.subscribe((updatedState, updatedKeys: string[]) => {
        let localTodos = [];

        if (updatedKeys.includes("todos")) {
            localTodos = [...updatedState.todos];
        }
    })

    // Stop listening to updates
    unsubscribe();

    // Reset state to starting point (this won't remove your subscribers)
    store.reset();
```

#### iii. Access the current state via one-time subscriptions

```typescript
    // Subscribe ONCE for updates. When the target 'key' is updated, your listener
    // will be triggered with only that value, and subsequently unsubscribed. 
    // Below, we listen until 'state.someValue' is updated:
    const listener = (someValue: number) => {
        // ... do something with 'state.someValue'
    }

    // Note: You can EITHER listen until 'state.someValue' gets updated,
    store.subscribeOnce(listener, "someValue");

    // OR listen until 'someValue' is set to a specific update value. 
    // The example below will only fire when 'state.someValue === 3':
    store.subscribeOnce(listener, "someValue", (v) => v === 3);
```

> **NOTE:** Don't use uninstantiated keys at runtime, or you will get an error! Given our example
> above, the following will fail since `invalidKey` wasn't in the arguments to `createState`:
>
> ```javascript
> store.multiple({ wellThisIsNew: true, todos: [ ... ] })
> ```

---

## Usage - Property Type Assertions

Some state properties will require type assertions at initialization, in order to prevent compile-time errors. This becomes necessary if you want to initialize properties as `null`, and only provide real values later in your application lifecycle.

#### [✅] Example: Initializing an array property the Smart™ way

```typescript
// Cast the property in the initialization parameter
const store = createState({
    someArray: ([] as number[])
})

// This works because the property is now expecting a list of numbers
store.someArray([1,2,3]);
```

#### [❌] Example: Initializing an array property the *wrong* way

The following will cause you untold sorrows and gnashing of teeth.

```typescript
// Initialize an unspecified array type
const store = createState({
    someArray: []
})

// Pushing a list of numbers will fail because 'number' cannot be assigned to type 'never'
store.someArray([1,2,3]);

// Ugly workaround -> this will actually suppress the errors, but you will have to do it
// everywhere that you use this property, which makes for some ugly code
store.someArray(([1,2,3] as never[]))
```

---

## Usage - Examples

Some illustrative examples using popular front-end frameworks are provided below:

* [React: Using Functional Components](/readme-examples/react-functional-subscription.md)
* [VueJS (2x, 3x) Mixin](/readme-examples/vue-subscriber-mixin.md)
