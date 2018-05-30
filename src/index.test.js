import create from './index';

// Helpers
// REDUCERS
const SET_TODOS = todos => ({ todos });
const SET_BOOLEAN = boolean => ({ boolean })
// ACTION CREATORS
const setTodos = payload => ({ type: "SET_TODOS", payload });
const setBool = payload => ({ type: "SET_BOOLEAN", payload });
// Init Store
const {
    dispatch, 
    subscribe, 
    getState
} = create({ SET_BOOLEAN, SET_TODOS });
// Init unique store
const UniqueStore = create({ SET_BOOLEAN, SET_TODOS });

test('Initializes shared state with defined properties and null values', () => {
    const { todos, boolean } = getState();
    expect(todos).toBeDefined();
    expect(todos).toBeNull();
    
    expect(boolean).toBeDefined();
    expect(boolean).toBeNull();
});

test('Adds a unique property to the state', () => {
    expect(getState().todos).toBeNull();
    // 
    dispatch(setTodos([{ name: "Task1", done: false }]));
    expect(getState().todos).toBeTruthy();
    // 
    expect(UniqueStore.getState().todos).toBeNull();
});

test('Updates a unique property on state', () => {
    expect(getState().boolean).toBeNull();
    // 
    dispatch(setBool(!getState().boolean));
    expect(getState().boolean).toBe(true);
    expect(UniqueStore.getState().boolean).toBeNull();
    // 
    dispatch(setBool(!getState().boolean));
    expect(getState().boolean).toBe(false);
    expect(UniqueStore.getState().boolean).toBeNull();
});

test('Notifies a unique listener', () => {
    const listener = jest.fn();
    const uniqueListener = jest.fn();
    const unsubscribe = subscribe(listener);
    const uniqueUnsubscribe = UniqueStore.subscribe(uniqueListener);
    // 
    dispatch(setBool(!getState().boolean));
    expect(listener).toHaveBeenCalled();
    expect(uniqueListener).not.toHaveBeenCalled();
    unsubscribe();
    uniqueUnsubscribe();
});

test('Subscribes a unique listener to state', () => {
    expect(UniqueStore.subscribers.length).toBe(0);
    const unsubscribe1 = UniqueStore.subscribe(jest.fn);
    const unsubscribe2 = UniqueStore.subscribe(jest.fn);
    expect(UniqueStore.subscribers.length).toBe(1);
    unsubscribe1();
});

test('Unsubscribes a unique listener from state', () => {
    const unsubscribe1 = UniqueStore.subscribe(jest.fn);
    const unsubscribe2 = UniqueStore.subscribe(poof => null);
    expect(UniqueStore.subscribers.length).toBe(2);
    unsubscribe1();
    expect(UniqueStore.subscribers.length).toBe(1);
    unsubscribe2();
}) 