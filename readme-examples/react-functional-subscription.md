# ReactJS State Subscription With Functional Component
The following is an example of a functional component that subscribes to a global state instance.\
It is shown for illustrative purposes.

⚠️ Be vigilant with React functional components.
Your `unsubscribe` function must be defined inside a `useEffect` function, or your application may develop 
memory leaks due to lingering subscriptions. 

### EXAMPLE 1: Subscribe to a single state

```jsx
import { useEffect } from "react";
import store from "./path/to/my/store-instance";

/** A simple functional component  */
export default function FunctionalComponent(TargetComponent, stateKeys) {
    const [someValue, setSomeValue] = React.useState(0);
    
    useEffect(() => 
        // 'subscribe' returns a function, which will be used by 'useEffect' to
        // clean up when this component is unmounted. 
        store.subscribe(
            (updates: any, updatedKeys: string[]) => {
                if (!updatedKeys.includes("someValue")) return;
                setSomeValue(updates.someValue);
            }
        )
    )
  
    // Return some pretty UI
    return ( <p>{someValue}</p> )
}
```

---

### EXAMPLE 2: Subscribe to multiple state instances.
If you have multiple state instances, you can define multiple subscriptions for
a single component, and then return a single function that cleans them all up. 
```typescript
    useEffect(() => {
        // Subscribe to an example user state
        const unsubUser = UserStore.subscribeToKeys(
            (updates, updatedKeys) => {
                if (!updatedKeys.includes("username")) return;
                setUsername(updates.username);
            },
            ["username"]
        )

        // Subscribe to a separate state that contains the user's list of favorite games
        const unsubGames = GamesStore.subscribeToKeys(
            (({ favorites }) => {
                if (favorites && favorites.length) setFavorites(favorites)
            })
        )

        // Add as many as you want!
        
        // const unsubOtherThing = ...

        // Unsubscribe from all items at once
        return () => {
            unsubUser();
            unsubGames();
            // ...
        }
    })

```
