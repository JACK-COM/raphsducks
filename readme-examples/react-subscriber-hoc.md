# ReactJS State Subscriber Component
The following is an HOC that can be used to automate the subscription/unsubscription process with your global state. It is provided for illustrative purposes.
```typescript
import React from "react";
import AppStore from "../state";

/**
 * HOC that links `component` to Global State (AppStore)
 * @param {React.Component} TargetComponent Target `Component` to wrap
 * @param {string[]} stateKeys List of global state keys (for Target `props`)
 * @returns {React.Component} Wrapped Component that is subscribed to state, and updates
 * with new props when global state is changed.
 */
export default function StateComponent(TargetComponent, stateKeys) {
  /**
   * A Component that is automatically subscribed to `AppStore`
   */
  return class WrappedComponent extends React.PureComponent {

    unsubscribe = null;

    mounted = false;

    /**
     * Create a wrapped component. Initialize local state and global state subscription
     * @param {{[x:string]: any}} props Component props
     */
    constructor(props) {
      super(props);

      this.state = makeStateProps(stateKeys);
    }

    componentDidMount() {
      this.unsubscribe = AppStore.subscribe(this.onAppState);
      this.mounted = true;
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    onAppState = (state, updatedKeys) => {
      if (!this.mounted) return;

      // Build out updated dependant props and update state for re-render
      const propKeys = updatedKeys.filter((k) => stateKeys.includes(k));
      this.setState((s) => ({ ...s, ...makeStateProps(propKeys) }));
    };

    render() {
      // Return the target component with new/updated props
      const targetProps = { ...this.props, ...this.state };
      return <TargetComponent {...targetProps} />;
    }
  };
}

/**
 * Create a `props` object from Global State for a dependant `Component`.
 * @param {string[]} keys List of state properties/keys to be used in new props
 * @returns {{[x:string]: any}} Component props
 */
function makeStateProps(keys) {
  if (!keys.length) return {};

  const appState = AppStore.getState();
  return keys.reduce((agg, key) => ({ ...agg, [key]: appState[key] }), {});
}

```

## Usage
Instead of exporting your component directly, you can wrap it in the HOC. This allows you to
expect (and treat) global state properties as component props