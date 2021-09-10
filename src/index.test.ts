import createState from "./index";

const initialState = {
  todos: [],
  someBoolean: false,
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

  it("Resets state instance to inception", () => {
    // assert initial state
    expect(UniqueState.getState()).toStrictEqual(initialState);
    expect(DefaultState.getState()).toStrictEqual(initialState);

    // Updates
    const updates = {
      someBoolean: true,
      todos: [{ text: "Pet the cat", done: false }],
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
});
