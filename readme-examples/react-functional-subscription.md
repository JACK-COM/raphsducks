# ReactJS State Subscription via useEffect

The following example shows a functional component that subscribes to a global state instance.\
It is shown for illustrative purposes: you can adapt it as needed.

## Table of Contents

- [ReactJS State Subscription via useEffect](#reactjs-state-subscription-via-useeffect)
  - [Table of Contents](#table-of-contents)
  - [Important: Define Subscriptions inside useEffect](#important-define-subscriptions-inside-useeffect)
  - [Before we begin](#before-we-begin)
  - [EXAMPLE 1: Subscribe to a single state](#example-1-subscribe-to-a-single-state)
  - [EXAMPLE 2: Subscribe to a one or more keys in state](#example-2-subscribe-to-a-one-or-more-keys-in-state)
  - [EXAMPLE 3: Hooks and multiple state instances](#example-3-hooks-and-multiple-state-instances)

## Important: Define Subscriptions inside useEffect

> ⚠️ Your `unsubscribe` function must be defined inside a `useEffect` function, or your application may develop memory leaks due to lingering subscriptions.

## Before we begin

The following examples reference a fictional `userStore` that has been created/exported from somewhere in your app. Let's assume that the `userStore.getState()` returns something like this:

```typescript
{
    email: "person@email.com", // string
    authenticated: true // boolean
    // ... more properties
}
```

Now we can use this to experiment with an app's authentication state.

## EXAMPLE 1: Subscribe to a single state

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

## EXAMPLE 2: Subscribe to a one or more keys in state

If you only care about updates to *some* keys, use `subscribeToKeys`. The listener is the same, but we'll pass along the keys we want to be notified about. Your listener will only be called when those keys are updated.

```jsx
import { useEffect, useState } from "react";
import userStore from "./path/to/my/store-instance";

/** @route A simple Login route */
export default function Login() {
    const [loggedIn, setLoggedIn] = useState(false);
    
    useEffect(
        () => {
            // Listener defined here for readability. It MUST be
            // defined inside 'useEffect' to avoid memory leaks.
            const listener = (
                    updates: Partial<ReturnType<typeof myStore.getState()>>, 
                    updatedKeys: string[]
                ) => {
                    // We know that `updatedKeys` includes "authenticated"
                    // so we don't need to check. We also know it is "true" 
                    // because of the optional third argument used below.
                    setLoggedIn(updates.authenticated);
                }

            // 'subscribeToKeys' returns a function that will be used by
            //  'useEffect' to unsubscribe this component on unmount. 
            return store.subscribeToKeys(
                listener, 
                
                // Add the keys you want to subscribe to here
                ["authenticated"],
                
                // (OPTIONAL) you can use this third argument to perform 
                // value-checking outside the listener. This will ensure your 
                // listener only gets called when keys have specific values. 
                (stateKey, val) => {
                    // The function gets a key and current value, and must 
                    // return a boolean. It will be called for every key
                    // you pass into the "keys" array above
                    if (stateKey === "authenticated") return val === true;
                }
            )
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

---

## EXAMPLE 3: Hooks and multiple state instances

> Note: **This is a preferred way to deal with subscriptions**, because it limits the
> number of state subscribers at any given time.

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
            // User Listener + store unsubscription
            const userListener = (updates) => setUsername(updates.username)
            const unsubUser = userStore.subscribeToKeys(
                userListener, 
                ["username"]
            )

            // Products Listener + store unsubscription
            const productsListener = ({ saleItems, focusedProductSlug }) => {
                // Check in case one value is missing, since your app
                // may not update both simultaneously
                if (saleItems) setOnSale(saleItems)
                if (focusedProductSlug) setLastViewed(focusedProductSlug)
            }
            const unsubProducts = productsStore.subscribeToKeys(
                productsListener,
                
                // subscribe to these two keys
                ["saleItems", "focusedProductSlug"]
                
                // (optional) only tell me when "saleItems" has some content
                (key, newValue) => {
                    if (key === "saleItems") return newValue.length > 0;
                }
            )

            // Favorites Listener + store unsubscription
            const favesListener = (updates) => 
                setFavorites(updates.favorites)
            const unsubFavorites = favoritesStore.subscribeToKeys(
                favesListener, 
                ["favorites"]
            )

            // ...AND MANY MORE!
            

            // Now return a function that calls all unsubscribers at once.
            // Whenever the hook gets unmounted, all subscriptions above
            // will end.
            return () => {
                unsubUser();
                unsubProducts();
                unsubFavorites();
            }
    }, [])

    // Expose hook state to other components
    return {username, onSale, lastViewed, shopFriends}
    
}

```
