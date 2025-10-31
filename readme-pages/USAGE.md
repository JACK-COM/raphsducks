# How to use *raphsducks*

## Table of Contents

- [How to use *raphsducks*](#how-to-use-raphsducks)
  - [Table of Contents](#table-of-contents)
  - [Usage - Core Concepts](#usage---core-concepts)
    - [Create your state instance](#create-your-state-instance)
    - [Use the state instance](#use-the-state-instance)
    - [3. Access values in the current state](#3-access-values-in-the-current-state)
      - [Read the current state](#read-the-current-state)
      - [Subscribe to the current state](#subscribe-to-the-current-state)
      - [Use a one-time subscription](#use-a-one-time-subscription)
  - [Usage - Property Type Assertions](#usage---property-type-assertions)
    - [Example: Initializing an array property](#example-initializing-an-array-property)
  - [Usage - Examples](#usage---examples)

---

## Usage - Core Concepts

### Create your state instance

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

### Use the state instance

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

#### Read the current state

Check current state. You can get the entire state object,

```typescript
    const currentState = store.getState(); // { todos: [...], someOtherValue: ... }
    
    // ...or deconstruct only what you need.
    const { todos } = store.getState();
```

#### Subscribe to the current state

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

#### Use a one-time subscription

```typescript
    // Subscribe ONCE for updates. When the target 'key' is updated, your listener
    // will be triggered with only that value, and subsequently unsubscribed. 
    // Below, we listen until 'state.numValue' is updated:
    const listener = ({numValue}:{numValue: number}) => {
        // ... do something with 'numValue'
    }

    // Ex. 1: Wait until 'state.numValue' gets updated
    store.subscribeOnce(listener, "numValue");

    // Ex. 2: Wait until 'state.numValue === 3'
    store.subscribeOnce(listener, "numValue", (v) => v === 3);
```

> [!NOTE]
> Don't use uninstantiated keys at runtime, or you will get an error! The following
> will throw an error if `invalidKey` is not in the initial state object:
>
> ```javascript
> store.multiple({ wellThisIsNew: true, todos: [ ... ] })
> // ERROR: 'wellThisIsNew' is not in this state instance
> ```

---

## Usage - Property Type Assertions

Some state properties will require type assertions at initialization, in order to prevent compile-time errors. This becomes necessary if you want to initialize properties as `null`, and only provide real values later in your application lifecycle.

### Example: Initializing an array property

* ✅ Cast the property in the initialization parameter:

```typescript
const store = createState({ myNumbers: [] as number[] });

// This works because the property is now expecting a list of numbers
store.myNumbers([1,2,3]);
```

* ❌ Initializing an array property without a type definition:

```typescript
// In this example, `myNumbers` initializes as type `never[]`
const store = createState({ myNumbers: [] });

// Pushing a list of numbers will fail because 'number' cannot be assigned to type 'never'
store.myNumbers([1,2,3]); // Type error: cannot assign `number` to `never`
```

---

## Usage - Examples

Some illustrative examples using popular front-end frameworks are provided below:

* [React: Using Functional Components](/readme-examples/README-REACTJS.md)
* [VueJS (2x, 3x) Mixin](/readme-examples/README-VUEJS.md)
