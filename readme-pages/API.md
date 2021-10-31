# `ApplicationStore` instance API
  
`ApplicationStore` is the class instance returned from `createState(state)`. Below is an overview of the methods found in it.\
Any mention of `state` is a reference to your initial state, which you pass into the `createState(state)` function

## Instance Methods

`getState(): state`
* Get [a copy of] the current application state 
```typescript
  getState(): state;
```
`multiple(changes): void`:
* Update multiple keys in state before notifying subscribers.
```typescript
  multiple(changes: Partial<state>): void;
```

`reset(clearSubscribers?): void`
* Reset the instance to its initialized state while preserving subscribers.
* Pass `true` into the function if you want to also clear all state subscribers.
```typescript
  /**
   * @param {boolean} clearSubscribers -> when true, resets state AND removes
   * any current listeners.
   */
  reset(clearSubscribers?: boolean): void;
```

`subscribe(fn): unsubscribeFn`
* Subscribe to the state instance. Returns an `unsubscribe` function
```typescript
  /**
   * @param {Function} listener -> function to call on state update
   * 
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener: ListenerFn): Unsubscriber;
```

`subscribeOnce(l: ListenerFn, key: string, valueCheck?: (v: any) => boolean): unsubscribeFn`
* Subscribe until a specified `key` is updated, then unsubscribe. 
* Optionally takes a value-checker in case you want to subscribe until a particular value is received.
```typescript
  /**
   * @param {Function} listener -> Listener function
   * @param {string} key -> Key to check for updates
   * @param {Function} valueCheck -> (Optional) assert the value of 
   * `key` when state is updated.
   * 
   * @returns {Function} Unsubscribe function
   */
  subscribeOnce(
    listener: ListenerFn,
    key: string,
    valueCheck?: (some: any) => boolean
  ): Unsubscriber;
```

`subscribeToKeys(l: ListenerFn, keys: string[], valueCheck?: (v: any) => boolean)`
* Subscribe to changes applied to a subset of state properties. 
* Optionally takes a value-checker in case you want to listen for particular values.
```typescript
  /**
   * @param {Function} listener -> Listener function
   * @param {string[]} keys -> List of state keys to "watch" for updates
   * 
   * @returns {Unsubscriber} -> Unsubscribe function
   */
  subscribeToKeys(
    listener: ListenerFn,
    keys: string[],
    valueCheck?: (key: string, expectedValue: any) => boolean
  ): Unsubscriber;
}
```

---

## Additional notes
**Note:** In addition to the listed values, any key in your initial state will be turned into an instance method. For example:

```typescript
type User = { name: string }

const userState = createState({ user: null as User })
```

returns an instance that you can use like this:

```typescript
userState.user({ name: "Jeremy" });
userState.multiple({ user: { name: "Jeremy" }})

userState.user(null);
```
