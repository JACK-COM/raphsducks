# ReactJS State Subscription With Functional Component
The following is an example of a functional component that subscribes to a global state instance.\
It is shown for illustrative purposes.
```jsx
import React from "react";
import store from "./path/to/my/store-instance";

/**
 * Functional component that can subscribe to global state. Uses `useEffect` to
 * handle unsubscription
 */
export default function FunctionalComponent(TargetComponent, stateKeys) {
    const [someValue, setSomeValue] = React.useState(0);
    
    // ⚠️ React functional components do not play nice with raphsducks. Component 
    // subscriptions get duplicated, though it is unclear why. Use with caution!
    React.useEffect(() => 
        // 'subscribe' returns a function, which will be used by 'useEffect' to
        // clean up when this component is unmounted.
        store.subscribe(
            (updates: any, updatedKeys: string[]) => {
                if (!updatedKeys.includes("someValue")) return;
                setSomeValue(updates.someValue);
            }
        )
    )
  
    return (
        <p>{someValue}</p>
    )
}

```
