import createState from "./index";

const initialState = {
  todos: [] as any[],
  someBoolean: false,
  someString: "",
};
// State Instances
const DefaultState = createState(initialState);
const UniqueState = createState(initialState);

describe("Application State Manager", () => {
  afterEach(() => {
    DefaultState.reset();
    UniqueState.reset();
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
    try {
      DefaultState.invalid(true);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });

  it("Updates multiple properties before notifying subscribers once", () => {
    const listener = jest.fn();
    const unsubscribe = DefaultState.subscribe(listener);
    DefaultState.multiple({
      someBoolean: true,
      todos: [1, 2, 4],
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("Notifies only listeners subscribed to its instance", () => {
    const listener = jest.fn();
    const uniqueListener = jest.fn();
    const notEvenListening = jest.fn();
    const unsub1 = DefaultState.subscribe(listener);
    const unsub2 = UniqueState.subscribe(uniqueListener);
    //
    DefaultState.someBoolean(true);
    expect(listener).toHaveBeenCalledWith(
      { ...initialState, someBoolean: true },
      ["someBoolean"]
    );
    expect(uniqueListener).not.toHaveBeenCalled();
    expect(notEvenListening).not.toHaveBeenCalled();

    // cleanup
    unsub1!();
    unsub2!();
  });

  it("Subscribes a unique listener to state", () => {
    // Assert no listeners
    expect(UniqueState.subscribers.length).toBe(0);
    expect(DefaultState.subscribers.length).toBe(0);
    // Subscribe twice with the same function ref:
    const unsubscribe1 = UniqueState.subscribe(jest.fn);
    const unsubscribe2 = UniqueState.subscribe(jest.fn);

    // Assert only one subscriber in relevant statae
    expect(UniqueState.subscribers.length).toBe(1);
    expect(DefaultState.subscribers.length).toBe(0);

    // cleanup
    unsubscribe1!();
  });

  it("Subscribes a unique listener ONCE to state, then unsubscribes", () => {
    // Assert no listeners
    expect(UniqueState.subscribers.length).toBe(0);
    expect(DefaultState.subscribers.length).toBe(0);

    const spy = jest.fn();
    // Subscribe twice with the same function ref:
    UniqueState.subscribeOnce(spy, "someBoolean");
    expect(UniqueState.subscribers.length).toBe(1);

    // Update a different key
    UniqueState.todos([123]);
    expect(spy).not.toHaveBeenCalled();

    // Update target key
    UniqueState.someBoolean(true);
    UniqueState.someBoolean(false);

    // assert spy has been unsubscribed
    expect(spy).toHaveBeenCalledTimes(1);
    expect(UniqueState.subscribers.length).toBe(0);
  });

  it("Subscribes ONCE until a value is received, then unsubscribes", () => {
    // Assert no listeners
    expect(UniqueState.subscribers.length).toBe(0);
    expect(DefaultState.subscribers.length).toBe(0);

    const spy = jest.fn();

    // Subscribe twice with the same function ref:
    UniqueState.subscribeOnce(spy, "someBoolean", (a: boolean) => a === false);
    expect(UniqueState.subscribers.length).toBe(1);
    expect(DefaultState.subscribers.length).toBe(0);

    // Update a different key
    UniqueState.todos([123]);
    expect(spy).not.toHaveBeenCalled();

    // Update target key
    UniqueState.someBoolean(true);
    UniqueState.multiple({ someBoolean: null, todos: [] });
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someBoolean(false);

    // assert spy has been unsubscribed
    expect(spy).toHaveBeenCalledTimes(1);
    expect(UniqueState.subscribers.length).toBe(0);
  });

  it("subscribes to a subset of keys", () => {
    expect(UniqueState.subscribers.length).toBe(0);
    const spy = jest.fn();
    const unsubscribe = UniqueState.subscribeToKeys(spy, ["someString"]);

    UniqueState.someBoolean(false);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.todos([1, 2, 3, 4, 5]);
    expect(spy).not.toHaveBeenCalled();

    UniqueState.someString("hello");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ someString: "hello" }, ["someString"]);
    unsubscribe();
  });

  it("subscribes to a subset of keys and expected values", () => {
    expect(UniqueState.subscribers.length).toBe(0);
    const spy = jest.fn();
    const key = "someString";
    const expected = "goodbye";
    const check = (k: string, v: any) => k === key && v === expected;
    const unsubscribe = UniqueState.subscribeToKeys(spy, [key], check);

    UniqueState.someBoolean(false);
    expect(spy).not.toHaveBeenCalled();
    
    UniqueState.todos([1, 2, 3, 4, 5]);
    expect(spy).not.toHaveBeenCalled();
    
    UniqueState.someString("hello");
    expect(spy).not.toHaveBeenCalled();
    
    UniqueState.multiple({
      someString: key,
      todos: [5, 4, 3, 2, 1],
      someBoolean: true,
    });
    expect(spy).not.toHaveBeenCalled();
    
    UniqueState.someString("goodbye");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ [key]: expected }, [key]);
    unsubscribe();
  });

  it("Unsubscribes listeners from state instance", () => {
    // Test
    const stub = jest.fn();
    const poof = jest.fn();
    const unsubscribe1 = UniqueState.subscribe(stub);
    const unsubscribe2 = UniqueState.subscribe(poof);
    // Control
    const unsubscribe1A = DefaultState.subscribe(stub);
    const unsubscribe2A = DefaultState.subscribe(poof);
    // start
    expect(UniqueState.subscribers.length).toBe(2);
    expect(DefaultState.subscribers.length).toBe(2);
    // trigger state change
    UniqueState.multiple({
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
    });
    // assert subscribers were triggered
    expect(stub).toHaveBeenCalled();
    expect(poof).toHaveBeenCalled();
    // unsubscribe the bastards
    unsubscribe1();
    unsubscribe2();

    expect(UniqueState.subscribers.length).toBe(0);
    expect(DefaultState.subscribers.length).toBe(2);
    // cleanup
    unsubscribe1A();
    unsubscribe2A();
    expect(DefaultState.subscribers.length).toBe(0);
  });

  it("Resets state instance to inception while preserving subscribers", () => {
    // assert initial state
    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(initialState);

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
      someString: "Hello",
    };

    const spyScriber = jest.fn();
    const unsubscribe = UniqueState.subscribe(spyScriber);

    // trigger state change
    UniqueState.multiple(updates);
    UniqueState.reset(true);
    expect(spyScriber).toHaveBeenCalledTimes(1);

    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(initialState);

    unsubscribe();
  });
});