import createState from "./index";
import { Unsubscriber } from "./types";

const initialState = {
  todos: [] as any[],
  someBoolean: false as boolean | null,
  someString: ""
};
// State Instances
const DefaultState = createState(initialState);
const UniqueState = createState(initialState);

describe("Application State Manager", () => {
  beforeEach(() => {});

  afterEach(() => {
    DefaultState.reset();
    UniqueState.reset();
  });

  afterAll(() => {
    DefaultState.reset(true);
    UniqueState.reset(true);
  });

  it("Initializes state with defined properties and default values", () => {
    const { todos, someBoolean } = DefaultState.getState();
    expect(todos).toStrictEqual([]);
    expect(someBoolean).toStrictEqual(false);
  });

  it("Adds a property to unique state instance", () => {
    let uniqueState = UniqueState.getState();
    expect(uniqueState.todos).toStrictEqual([]);
    expect(uniqueState.someBoolean).toStrictEqual(false);

    // Modify one state and compare
    DefaultState.todos([{ text: "Pet the cat", done: false }]);

    // compare
    const todos = DefaultState.getState().todos;
    expect(todos.length).toBe(1);
    expect(todos[0]).toStrictEqual({ text: "Pet the cat", done: false });

    uniqueState = UniqueState.getState();
    expect(uniqueState.todos.length).toBe(0);
  });

  it("Accepts only initialized properties", () => {
    expect(() => DefaultState.invalid(true)).toThrow();
  });

  it("Updates a property ONCE if no other properties change", () => {
    const listener = jest.fn();
    const unsub = DefaultState.subscribe(listener);
    expect(DefaultState.subscribers.length).toBe(1);

    DefaultState.someBoolean(true);
    DefaultState.someBoolean(true); // call it twice
    DefaultState.someBoolean(true); // call it thrice
    DefaultState.someBoolean(true); // make it nice
    expect(DefaultState.getState().someBoolean).toStrictEqual(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    expect(DefaultState.subscribers.length).toBe(0);
  });

  it("Updates multiple properties before notifying subscribers once", () => {
    const listener = jest.fn();
    expect(DefaultState.subscribers.length).toBe(0);
    const unsub = DefaultState.subscribe(listener);
    expect(DefaultState.subscribers.length).toBe(1);

    let st = DefaultState.getState();
    expect(st.someBoolean).toStrictEqual(false);
    expect(st.todos.length).toBe(0);

    DefaultState.multiple({
      someBoolean: true,
      todos: [1, 2, 4]
    });
    unsub();
    expect(DefaultState.subscribers.length).toBe(0);

    st = DefaultState.getState();
    expect(st.someBoolean).toStrictEqual(true);
    expect(st.todos.length).toBe(3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("Notifies only listeners subscribed to its instance", () => {
    const listener = jest.fn();
    const uniqueListener = jest.fn();
    const notEvenListening = jest.fn();
    const unDefa = DefaultState.subscribe(listener);
    const unUniq = UniqueState.subscribe(uniqueListener);
    const cleanup = () => {
      unDefa();
      unUniq();
    };

    // Updates
    DefaultState.someBoolean(true);
    expect(listener).toHaveBeenCalledWith(
      { ...initialState, someBoolean: true },
      ["someBoolean"]
    );
    expect(uniqueListener).not.toHaveBeenCalled();
    expect(notEvenListening).not.toHaveBeenCalled();
    cleanup();
  });

  it("Subscribes a unique listener to state", () => {
    // Subscribe twice with the same function ref:
    const spy = jest.fn();
    const sub1 = UniqueState.subscribe(spy);
    const sub2 = UniqueState.subscribe(spy);
    const cleanup = () => {
      sub1();
      sub2();
    };

    // Assert only one subscriber in relevant statae
    UniqueState.someString("hello!!");
    expect(spy).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("Subscribes a unique listener ONCE to state, then unsubscribes", () => {
    const spy = jest.fn();
    const unique = jest.fn();
    // Subscribe twice with the same function ref:
    const u1 = UniqueState.subscribeOnce(unique);
    const u2 = UniqueState.subscribeOnce(spy, "someBoolean");
    const cleanup = () => {
      u1();
      u2();
      expect(UniqueState.subscribers.length).toBe(0);
    };

    // Update a different key
    UniqueState.todos([123]);
    expect(spy).not.toHaveBeenCalled();

    // Update target key
    UniqueState.someBoolean(true);
    expect(UniqueState.getState().someBoolean).toStrictEqual(true);

    UniqueState.someBoolean(false);
    expect(UniqueState.getState().someBoolean).toStrictEqual(false);

    UniqueState.someBoolean(true);
    expect(UniqueState.getState().someBoolean).toStrictEqual(true);

    // assert spy has been unsubscribed
    expect(unique).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("Subscribes ONCE until a value is received, then unsubscribes", () => {
    const spy = jest.fn();

    // Subscribe twice with the same function ref:
    const cleanup = UniqueState.subscribeOnce(
      spy,
      "someBoolean",
      (a) => a === false
    );

    // Update a different key
    UniqueState.todos([123]);
    expect(spy).not.toHaveBeenCalled();

    // Update target key
    UniqueState.someBoolean(true);
    expect(UniqueState.getState().someBoolean).toStrictEqual(true);
    UniqueState.multiple({ someBoolean: null, todos: [] });
    expect(UniqueState.getState().someBoolean).toStrictEqual(null);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someBoolean(false);
    expect(UniqueState.getState().someBoolean).toStrictEqual(false);
    // assert spy has been unsubscribed
    cleanup();

    UniqueState.someBoolean(false);
    expect(UniqueState.getState().someBoolean).toStrictEqual(false);
    UniqueState.someBoolean(true);
    expect(UniqueState.getState().someBoolean).toStrictEqual(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("subscribes to a subset of keys", () => {
    const spy = jest.fn();
    const cleanup = UniqueState.subscribeToKeys(spy, ["someString"]);

    UniqueState.someBoolean(false);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.todos([1, 2, 3, 4, 5]);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someString("hello");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ someString: "hello" }, ["someString"]);
    cleanup();
  });

  it("subscribes to a subset of keys and expected values", () => {
    const spy = jest.fn();
    const key = "someString";
    const expected = "goodbye";
    const cleanup = UniqueState.subscribeToKeys(
      spy,
      [key],
      (k, v) => k === key && v === expected
    );

    UniqueState.someBoolean(false);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.todos([1, 2, 3, 4, 5]);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someString("hello");
    expect(spy).not.toHaveBeenCalled();

    UniqueState.multiple({
      someString: key,
      todos: [5, 4, 3, 2, 1],
      someBoolean: true
    });
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someString("goodbye");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ [key]: expected }, [key]);
    cleanup();
  });

  it("Unsubscribes listeners from state instance", () => {
    // Test
    const stub = jest.fn();
    const poof = jest.fn();
    const unsubs: Unsubscriber[] = [];
    const cleanup = () => unsubs.forEach((sub) => sub());

    unsubs.push(
      UniqueState.subscribe(stub),
      UniqueState.subscribe(poof),
      // Control
      DefaultState.subscribe(stub),
      DefaultState.subscribe(poof)
    );

    // start
    // trigger state change
    UniqueState.multiple({
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }]
    });

    cleanup();
    // trigger another state change
    UniqueState.multiple({
      someBoolean: true,
      todos: [{ text: "Pets the cat", done: true }]
    });
    // assert subscribers were triggered
    expect(stub).toHaveBeenCalledTimes(1);
    expect(poof).toHaveBeenCalledTimes(1);
  });

  it("Resets state instance to inception while preserving subscribers", () => {
    // assert initial state
    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(initialState);

    // Updates
    const updates = {
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
      someString: "Hello"
    };

    // trigger state change
    UniqueState.multiple(updates);
    DefaultState.multiple(updates);

    // assert state was changed
    expect(UniqueState.getState()).toStrictEqual(updates);
    expect(DefaultState.getState()).toStrictEqual(updates);

    // Reset one state and confirm it changed
    UniqueState.reset();
    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(updates);
  });

  it("Resets state instance to inception and removes subscribers", () => {
    // assert initial state
    expect(UniqueState.getState()).toStrictEqual(initialState);

    // Updates
    const updates = {
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
      someString: "Hello"
    };

    const spyScriber = jest.fn();
    const cleanup = UniqueState.subscribe(spyScriber);

    // trigger state change
    UniqueState.multiple(updates);
    UniqueState.reset(true);

    expect(spyScriber).toHaveBeenCalledTimes(1);
    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(initialState);
    cleanup();
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
    }
  };
  const controlSpy = jest.spyOn(control, "listener");
  const lastSpy = jest.spyOn(control, "lastOne");

  it(`Sets up a ${limit} jest spies update`, () => {
    do {
      // Subscribe 1000 spies 😧
      unsubscribers.push(
        i === limit - 1
          ? isolated.subscribe(control.lastOne)
          : isolated.subscribe(jest.fn())
      );
      i += 1;
    } while (i < limit);
    expect(unsubscribers.length).toStrictEqual(limit);
    expect(isolated.subscribers.length).toStrictEqual(limit);
    expect(i).toStrictEqual(limit);
    expect(controlSpy).toHaveBeenCalledTimes(0);
    expect(lastSpy).toHaveBeenCalledTimes(0);
    i = 0;
  });

  it(`Handles a ${limit} jest spies update`, () => {
    const cleanup = isolated.subscribe(control.listener);
    console.log(
      `start ${limit * 10} updates for ${isolated.subscribers.length} listeners`
    );
    // make changes
    do {
      i += 1;
      isolated.count(i);
    } while (i < limit * 10);
    const { count: final } = isolated.getState();
    console.log(`completed ${limit * 10} updates`);
    expect(final).toStrictEqual(limit * 10);
    expect(final).not.toStrictEqual(initial.count);
    expect(controlSpy).toHaveBeenCalledTimes(final);
    expect(lastSpy).toHaveBeenCalledTimes(final);

    // clear it all dammit. This test has earned itself a beer.
    isolated.reset(true);
    cleanup();
  });
});
