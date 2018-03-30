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

test('Initializes state with defined properties and null values', () => {
    const { todos, boolean } = getState();
    expect(todos).toBeDefined();
    expect(todos).toBeNull();
    
    expect(boolean).toBeDefined();
    expect(boolean).toBeNull();
})

test('Adds a property to the state', () => {
    expect(getState().todos).toBeNull();
    // 
    dispatch(setTodos([{ name: "Task1", done: false }]));
    expect(getState().todos).toBeTruthy();
})

test('Updates a property on state', () => {
    expect(getState().boolean).toBeNull();
    // 
    dispatch(setBool(!getState().boolean));
    expect(getState().boolean).toBe(true);
    // 
    dispatch(setBool(!getState().boolean));
    expect(getState().boolean).toBe(false);
})

test('Notifies a listener', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);
    // 
    dispatch(setBool(!getState().boolean));
    expect(listener).toHaveBeenCalled();
    unsubscribe();
})