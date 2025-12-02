# ReactJS State Subscription via useEffect

The following examples show functional components that use a `raphsducks` state instance.\
You can adapt them to your use-case.

- [ReactJS State Subscription via useEffect](#reactjs-state-subscription-via-useeffect)
  - [Important: Define Subscriptions inside useEffect](#important-define-subscriptions-inside-useeffect)
  - [EXAMPLE: Subscribe to a single state](#example-subscribe-to-a-single-state)
  - [EXAMPLE: Subscribe to a one or more keys in state](#example-subscribe-to-a-one-or-more-keys-in-state)
  - [EXAMPLE: Subscribe to multiple state instances](#example-subscribe-to-multiple-state-instances)

## Important: Define Subscriptions inside useEffect

> [!WARNING]
> Your `unsubscribe` function must be defined inside a `useEffect` function, or your application may develop memory leaks due to lingering subscriptions. This is shown in the following examples.

## EXAMPLE: Subscribe to a single state

This example shows how you can subscribe to *every* change in `userStore`.

```jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import userStore from "./path/to/my/store-instance";


/** @route A simple Login route */
export default function Login() {
    const [loggedIn, setLoggedIn] = useState(false);
    
    /* EXAMPLE 1: subscribe to *every* change to `userStore` */
    useEffect(
        () => {
            // Listener defined here for readability. It MUST be
            // defined inside 'useEffect' to avoid memory leaks.
            const listener = (
                    updates: Partial<ReturnType<typeof myStore.getState()>>, 
                    updatedKeys: string[]
                ) => {
                    // OPTIONAL: check if some value was updated. This is 
                    // equivalent to "if (updates.user) ...". It can be
                    // further simplified by using `subscribeToKeys`, which 
                    // only runs when your keys change.
                    if (updatedKeys.includes("authenticated")) {
                        // Act on the values if it has what you want
                        setLoggedIn(updates.authenticated);
                    }
                }

            // 'subscribe' returns a function that will be called by
            // 'useEffect' to unsubscribe this component on unmount. 
            return store.subscribe(listener)
        }, []
    )

    // Redirect to some authenticated page if user logged in
    if (loggedIn) return <Navigate to="/dashboard" />
  
    // Otherwise, return some pretty UI
    return ( 
        <form>
            {/* ✨ CSS and HTML ✨ */}
        </form> 
    )
}
```

## EXAMPLE: Subscribe to a one or more keys in state

If you only care about updates to *some* keys, use `subscribeToKeys`. The listener is the same, but we'll pass along the keys we want to be notified about. Your listener will only be called when those keys are updated.

```jsx
import { useEffect, useState } from "react";
import createState from "@jackcom/raphsducks"

// In a real world example, this would be exported from a shared module.
const userStore = createState({
    authenticated: false,
    email: null as string | null
})

/** @route A simple Login route */
export default function Login() {
    const [loggedIn, setLoggedIn] = useState(false);
    const onStateChange = (
            updates: Partial<ReturnType<typeof myStore.getState()>>, 
            updatedKeys: string[]
        ) => {
        // When this is called, `updatedKeys` is guaranteed to include 
        // "authenticated", so you don't need to check. 
        // It is also guaranteed to be "true" because of the optional 
        // third argument used in "subscribeToKeys".
        setLoggedIn(updates.authenticated);
    }
    
    useEffect(() => {
        // 'subscribeToKeys' returns a function that will be used by
        // 'useEffect' to unsubscribe this component on unmount. It MUST be
        // defined inside 'useEffect' to avoid memory leaks.
        return store.subscribeToKeys(
            // Call this when state changes
            onStateChange, 
            
            // Add the keys you want to subscribe to here
            ["authenticated"],
            
            // (OPTIONAL) Use this third argument to perform 
            // value-checking outside the listener. This example ensures the 
            // listener only gets called when "authenticated" === true
            (stateKey, val) => {
                // The function gets a key and current value, and must 
                // return a boolean. It will be called for every key
                // you pass into the "keys" array above
                if (stateKey === "authenticated") return val === true;
            }
        )
    }, [])

    // Redirect to some authenticated page if user logged in
    if (loggedIn) return <Navigate to="/dashboard" />
  
    // Otherwise, return a login form
    return ( 
        <form>
            {/* ✨ CSS and HTML ✨ */}
        </form> 
    )
}
```

---

## EXAMPLE: Subscribe to multiple state instances

If you have multiple state instances, you can condense multiple subscriptions into
a single function that handles unsubscription. This is a popular pattern when using hooks
in a large app.

```jsx
import { useEffect, useState } from "react";
import userStore from "./path/to/my/user-store";
import favoritesStore from "./path/to/my/favorites-store";
import productsStore, { Product } from "./path/to/my/products-store";


/** @hook An example hook that combines multiple state updates */
export default function useMultipleSubscriptions() {
    const [username, setUsername] = useState<string>();
    const [onSale, setOnSale] = useState<Product[]>([]);
    const [lastViewed, setLastViewed] = useState<string>();
    const [favorites, setFavorites] = useState<Product[]>([]);


    // The main difference between this and other examples is that we
    // define the returned cleanup function, since we will be 
    // creating multiple subscriptions at once.
    useEffect(
        () => {
            // User state subscription
            const unsubscribeUser = userStore.subscribeToKeys(
                ({ username }) => setUsername(username), 
                ["username"]
            )

            // Favorites state subscription
            const unsubscribeFavorites = favoritesStore.subscribeToKeys(
                ({ favorites }) =>  setFavorites(favorites), 
                ["favorites"]
            )

            // Products state listener and subscription
            const productsListener = ({ saleItems, focusedProductSlug }) => {
                // Check in case one value is missing, since your app
                // may not update both simultaneously
                if (saleItems) setOnSale(saleItems)
                if (focusedProductSlug) setLastViewed(focusedProductSlug)
            }
            const unsubscribeProducts = productsStore.subscribeToKeys(
                productsListener,
                
                // subscribe to these two keys
                ["saleItems", "focusedProductSlug"]
                
                // (optional) only tell me when "saleItems" has some content
                (key, newValue) => {
                    if (key === "saleItems") return newValue.length > 0;
                }
            )

            // ...AND MANY MORE!

            // Return a function that calls all unsubscribers at once.
            // When the hook gets unmounted, all subscriptions will end.
            return () => {
                unsubscribeUser();
                unsubscribeProducts();
                unsubscribeFavorites();
            }
    }, [])

    // Expose hook state to other components
    return { username, onSale, lastViewed, shopFriends }
    
}
```
