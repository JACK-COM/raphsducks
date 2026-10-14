import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import createState from "./index.ts";
import type { Unsubscriber } from "./types.ts";

const initialState = {
  todos: [] as unknown[],
  someBoolean: false as boolean | null,
  someString: "",
};
// State Instances
const DefaultState = createState(initialState);
const UniqueState = createState(initialState);

/** Passes when any recorded call received exactly `args` (jest's toHaveBeenCalledWith) */
function assertCalledWith(
  fn: { mock: { calls: { arguments: unknown[] }[] } },
  ...args: unknown[]
) {
  const calls = fn.mock.calls.map((c) => c.arguments);
  const matched = calls.some((received) => {
    try {
      assert.deepEqual(received, args);
      return true;
    } catch {
      return false;
    }
  });
  assert.ok(
    matched,
    `no call matched ${JSON.stringify(args)}; got ${JSON.stringify(calls)}`,
  );
}

describe("Application State Manager", () => {
  afterEach(() => {
    DefaultState.reset();
    UniqueState.reset();
  });

  after(() => {
    DefaultState.reset(true);
    UniqueState.reset(true);
  });

  it("Initializes state with defined properties and default values", () => {
    const { todos, someBoolean } = DefaultState.getState();
    assert.deepEqual(todos, []);
    assert.deepEqual(someBoolean, false);
  });

  it("Adds a property to unique state instance", () => {
    let uniqueState = UniqueState.getState();
    assert.deepEqual(uniqueState.todos, []);
    assert.deepEqual(uniqueState.someBoolean, false);

    // Modify one state and compare
    DefaultState.todos([{ text: "Pet the cat", done: false }]);

    // compare
    const todos = DefaultState.getState().todos;
    assert.equal(todos.length, 1);
    assert.deepEqual(todos[0], { text: "Pet the cat", done: false });

    uniqueState = UniqueState.getState();
    assert.equal(uniqueState.todos.length, 0);
  });

  it("Accepts only initialized properties", () => {
    assert.throws(() => DefaultState.invalid(true));
  });

  it("Updates a property ONCE if no other properties change", () => {
    const listener = mock.fn();
    const unsub = DefaultState.subscribe(listener);
    assert.equal(DefaultState.subscribers, 1);

    DefaultState.someBoolean(true);
    DefaultState.someBoolean(true); // call it twice
    DefaultState.someBoolean(true); // call it thrice
    DefaultState.someBoolean(true); // make it nice
    assert.deepEqual(DefaultState.getState().someBoolean, true);
    assert.equal(listener.mock.callCount(), 1);
    unsub();
    assert.equal(DefaultState.subscribers, 0);
  });

  it("Updates multiple properties before notifying subscribers once", () => {
    const listener = mock.fn();
    assert.equal(DefaultState.subscribers, 0);
    const unsub = DefaultState.subscribe(listener);
    assert.equal(DefaultState.subscribers, 1);

    let st = DefaultState.getState();
    assert.deepEqual(st.someBoolean, false);
    assert.equal(st.todos.length, 0);

    DefaultState.multiple({
      someBoolean: true,
      todos: [1, 2, 4],
    });
    unsub();
    assert.equal(DefaultState.subscribers, 0);

    st = DefaultState.getState();
    assert.deepEqual(st.someBoolean, true);
    assert.equal(st.todos.length, 3);
    assert.equal(listener.mock.callCount(), 1);
  });

  it("Notifies only listeners subscribed to its instance", () => {
    const listener = mock.fn();
    const uniqueListener = mock.fn();
    const notEvenListening = mock.fn();
    const unDefa = DefaultState.subscribe(listener);
    const unUniq = UniqueState.subscribe(uniqueListener);
    const cleanup = () => {
      unDefa();
      unUniq();
    };

    // Updates
    DefaultState.someBoolean(true);
    assertCalledWith(listener, { ...initialState, someBoolean: true }, [
      "someBoolean",
    ]);
    assert.equal(uniqueListener.mock.callCount(), 0);
    assert.equal(notEvenListening.mock.callCount(), 0);
    cleanup();
  });

  it("Subscribes a unique listener to state", () => {
    // Subscribe twice with the same function ref:
    const spy = mock.fn();
    const sub1 = UniqueState.subscribe(spy);
    const sub2 = UniqueState.subscribe(spy);
    const cleanup = () => {
      sub1();
      sub2();
    };

    // Assert only one subscriber in relevant statae
    UniqueState.someString("hello!!");
    assert.equal(spy.mock.callCount(), 1);
    cleanup();
  });

  it("Subscribes a unique listener ONCE to state, then unsubscribes", () => {
    const spy = mock.fn();
    const unique = mock.fn();
    // Subscribe twice with the same function ref:
    const u1 = UniqueState.subscribeOnce(unique);
    const u2 = UniqueState.subscribeOnce(spy, "someBoolean");
    const cleanup = () => {
      u1();
      u2();
      assert.equal(UniqueState.subscribers, 0);
    };

    // Update a different key
    UniqueState.todos([123]);
    assert.equal(spy.mock.callCount(), 0);

    // Update target key
    UniqueState.someBoolean(true);
    assert.deepEqual(UniqueState.getState().someBoolean, true);

    UniqueState.someBoolean(false);
    assert.deepEqual(UniqueState.getState().someBoolean, false);

    UniqueState.someBoolean(true);
    assert.deepEqual(UniqueState.getState().someBoolean, true);

    // assert spy has been unsubscribed
    assert.equal(unique.mock.callCount(), 1);
    assert.equal(spy.mock.callCount(), 1);
    cleanup();
  });

  it("Subscribes ONCE until a value is received, then unsubscribes", () => {
    const spy = mock.fn();

    // Subscribe twice with the same function ref:
    const cleanup = UniqueState.subscribeOnce(
      spy,
      "someBoolean",
      (a) => a === false,
    );

    // Update a different key
    UniqueState.todos([123]);
    assert.equal(spy.mock.callCount(), 0);

    // Update target key
    UniqueState.someBoolean(true);
    assert.deepEqual(UniqueState.getState().someBoolean, true);
    UniqueState.multiple({ someBoolean: null, todos: [] });
    assert.deepEqual(UniqueState.getState().someBoolean, null);
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.someBoolean(false);
    assert.deepEqual(UniqueState.getState().someBoolean, false);
    // assert spy has been unsubscribed
    cleanup();

    UniqueState.someBoolean(false);
    assert.deepEqual(UniqueState.getState().someBoolean, false);
    UniqueState.someBoolean(true);
    assert.deepEqual(UniqueState.getState().someBoolean, true);
    assert.equal(spy.mock.callCount(), 1);
  });

  it("subscribes to a subset of keys", () => {
    const spy = mock.fn();
    const cleanup = UniqueState.subscribeToKeys(spy, ["someString"]);

    UniqueState.someBoolean(false);
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.todos([1, 2, 3, 4, 5]);
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.someString("hello");
    assert.equal(spy.mock.callCount(), 1);
    assertCalledWith(spy, { someString: "hello" }, ["someString"]);
    cleanup();
  });

  it("subscribes to a subset of keys and expected values", () => {
    const spy = mock.fn();
    const key = "someString";
    const expected = "goodbye";
    const cleanup = UniqueState.subscribeToKeys(
      spy,
      [key],
      (k, v) => k === key && v === expected,
    );

    UniqueState.someBoolean(false);
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.todos([1, 2, 3, 4, 5]);
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.someString("hello");
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.multiple({
      someString: key,
      todos: [5, 4, 3, 2, 1],
      someBoolean: true,
    });
    assert.equal(spy.mock.callCount(), 0);

    UniqueState.someString("goodbye");
    assert.equal(spy.mock.callCount(), 1);
    assertCalledWith(spy, { [key]: expected }, [key]);
    cleanup();
  });

  it("Unsubscribes listeners from state instance", () => {
    // Test
    const stub = mock.fn();
    const poof = mock.fn();
    const unsubs: Unsubscriber[] = [];
    const cleanup = () => unsubs.forEach((sub) => sub());

    unsubs.push(
      UniqueState.subscribe(stub),
      UniqueState.subscribe(poof),
      // Control
      DefaultState.subscribe(stub),
      DefaultState.subscribe(poof),
    );

    // start
    // trigger state change
    UniqueState.multiple({
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
    });

    cleanup();
    // trigger another state change
    UniqueState.multiple({
      someBoolean: true,
      todos: [{ text: "Pets the cat", done: true }],
    });
    // assert subscribers were triggered
    assert.equal(stub.mock.callCount(), 1);
    assert.equal(poof.mock.callCount(), 1);
  });

  it("Resets state instance to inception while preserving subscribers", () => {
    // assert initial state
    assert.deepEqual(UniqueState.getState(), initialState);
    assert.deepEqual(DefaultState.getState(), initialState);

    // Updates
    const updates = {
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
      someString: "Hello",
    };

    // trigger state change
    UniqueState.multiple(updates);
    DefaultState.multiple(updates);

    // assert state was changed
    assert.deepEqual(UniqueState.getState(), updates);
    assert.deepEqual(DefaultState.getState(), updates);

    // Reset one state and confirm it changed
    UniqueState.reset();
    assert.deepEqual(UniqueState.getState(), initialState);
    assert.deepEqual(DefaultState.getState(), updates);
  });

  it("Resets state instance to inception and removes subscribers", () => {
    // assert initial state
    assert.deepEqual(UniqueState.getState(), initialState);

    // Updates
    const updates = {
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
      someString: "Hello",
    };

    const spyScriber = mock.fn();
    const cleanup = UniqueState.subscribe(spyScriber);

    // trigger state change
    UniqueState.multiple(updates);
    UniqueState.reset(true);

    assert.equal(spyScriber.mock.callCount(), 1);
    assert.deepEqual(UniqueState.getState(), initialState);
    assert.deepEqual(DefaultState.getState(), initialState);
    cleanup();
  });

  it("Serializes a state instance", () => {
    const str = DefaultState.serialize();
    assert.equal(typeof str, "string");
  });
});

describe("Application State High Intensity", () => {
  const initial = { count: 0 };
  const isolated = createState(initial);
  const unsubscribers: Unsubscriber[] = [];
  // create listeners
  let i = 0;
  const limit = 650;
  const control = {
    lastOne() {},
    listener: (state: any, k: string[]) => {
      console.assert(state);
      console.assert(k);
    },
  };
  const controlSpy = mock.method(control, "listener");
  const lastSpy = mock.method(control, "lastOne");

  it(`Sets up a ${limit} mock listeners update`, () => {
    do {
      // Subscribe 1000 spies 😧
      unsubscribers.push(
        i === limit - 1
          ? isolated.subscribe(control.lastOne)
          : // A fresh closure per pass (subscribe dedupes by reference). Not
            // mock.fn(): node:test stores a stack trace per call, and the
            // next test's ~4M calls exhaust the heap.
            isolated.subscribe(() => {}),
      );
      i += 1;
    } while (i < limit);
    assert.deepEqual(unsubscribers.length, limit);
    assert.deepEqual(isolated.subscribers, limit);
    assert.deepEqual(i, limit);
    assert.equal(controlSpy.mock.callCount(), 0);
    assert.equal(lastSpy.mock.callCount(), 0);
    i = 0;
  });

  it(`Handles a ${limit * 10} mock listeners update`, () => {
    const cleanup = isolated.subscribe(control.listener);
    console.log(
      `start ${limit * 10} updates for ${isolated.subscribers} listeners`,
    );
    // make changes
    do {
      i += 1;
      isolated.count(i);
    } while (i < limit * 10);
    const { count: final } = isolated.getState();
    console.log(`completed ${limit * 10} updates`);
    assert.deepEqual(final, limit * 10);
    assert.notDeepEqual(final, initial.count);
    assert.equal(controlSpy.mock.callCount(), final);
    assert.equal(lastSpy.mock.callCount(), final);

    // clear it all dammit. This test has earned itself a beer.
    isolated.reset(true);
    cleanup();
  });
});
