import { createState, createSetterActions } from './index';

// SETTERS
const setToDos = todos => ({ todos });
const setBoolean = boolean => ({ boolean })
const setters = { setBoolean, setToDos };
// State Instances
const DefaultState = createState(setters);
const UniqueState = createState({ setBoolean, setToDos });
// Action Creators
const Actions = createSetterActions(setters)

test('Initializes shared state with defined properties and null values', () => {
    const { todos, boolean } = DefaultState.getState();
    expect(todos).toBeDefined();
    expect(todos).toBeNull();
    
    expect(boolean).toBeDefined();
    expect(boolean).toBeNull();
});

test('Create actions for setters', () => {
    expect(Actions.setBooleanAction).toBeDefined();
    expect(Actions.setToDosAction).toBeDefined();
})

test('Adds a property to unique state instance', () => {
    const todos = DefaultState.getState().todos;
    expect(todos).toBeNull();
    // 
    DefaultState.dispatch(Actions.setToDosAction(false));
    expect(DefaultState.getState().todos).toBe(false);
    expect(UniqueState.getState().todos).toBeNull();
});

test('Updates a unique property on state', () => {
    const defaultBool = DefaultState.getState().boolean;
    expect(defaultBool).toBeNull();
    // 
    DefaultState.dispatch(Actions.setBooleanAction(!defaultBool));
    expect(DefaultState.getState().boolean).toBe(true);
    expect(UniqueState.getState().boolean).toBeNull();
    // 
    DefaultState.dispatch(Actions.setBooleanAction(!DefaultState.getState().boolean));
    expect(DefaultState.getState().boolean).toBe(false);
    expect(UniqueState.getState().boolean).toBeNull();
});

test('Notifies a unique listener', () => {
    const listener = jest.fn();
    const uniqueListener = jest.fn();
    const unsubscribe = DefaultState.subscribe(listener);
    const uniqueUnsubscribe = UniqueState.subscribe(uniqueListener);
    // 
    DefaultState.dispatch(Actions.setBooleanAction(!DefaultState.getState().boolean));
    expect(listener).toHaveBeenCalled();
    expect(uniqueListener).not.toHaveBeenCalled();
    unsubscribe();
    uniqueUnsubscribe();
});

test('Subscribes a unique listener to state', () => {
    expect(UniqueState.subscribers.length).toBe(0);
    const unsubscribe1 = UniqueState.subscribe(jest.fn);
    const unsubscribe2 = UniqueState.subscribe(jest.fn);
    expect(UniqueState.subscribers.length).toBe(1);
    unsubscribe1();
});

test('Unsubscribes listeners from state', () => {
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
    UniqueState.dispatch(Actions.setBooleanAction(true));
    UniqueState.dispatch(Actions.setBooleanAction(false));
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
}) 
