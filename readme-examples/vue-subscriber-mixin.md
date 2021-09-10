# VueJS mixin example
This is a VueJS mixin that connects any implementing component to the app state. It is provided for illustrative purposes.

```typescript
import AppStore from "./path/to/my/state.js";

const GlobalStateMixin = {
  data() {
    // The "stateKeys" property will be used to selectively react to global state changes.
    // See the "onAppState" method below. It should be overridden by subcomponents. 
    return { unsubscribe: null, stateKeys: ["todos"], store: {} };
  },

  /* Subscribe to global app state and set initial component state */
  mounted() {
    this.unsubscribe = AppStore.subscribe(this.onAppState);
    this.onAppState(AppStore.getState(), this.stateKeys);
  },

  /* Unsubscribe from global app state */
  beforeUnmount() {
    this.unsubscribe();
  },

  methods: {
    /**
     * Update component's local state with data from global state
     * @param {{[x:string]: any}} state Global App State
     * @param {string[]} updatedKeys List of keys that were just updated
     */
    onAppState(state, updatedKeys) {
      // Only update with values that this component cares about.
      const updates = updatedKeys.reduce((agg, key) => {
        if (this.stateKeys.includes(key)) agg[key] = state[key];
        return agg;
      }, {});

      // Update object reference so dependant UI can refresh
      this.store = { ...this.store, ...updates };
    },
  },
};

export default GlobalStateMixin;
```

When implemented, it will subscribe the component on mount, and unsubscribe when the component is removed from the DOM.

**Note:** You don't *need* to subscribe to a `state` instance in order to either read from or write to it. 
