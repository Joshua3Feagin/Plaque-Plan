// App entry point.
//
// We register the Expo Router root manually with a LITERAL `require.context('./app')`
// instead of relying on `expo-router/entry`. The literal string is resolved by
// Metro at build time on every platform (iOS, Android, and the static web
// bundler), which avoids the monorepo-only failure where babel-preset-expo
// can't inline `process.env.EXPO_ROUTER_APP_ROOT` into expo-router's
// `require.context(...)` — the error "First argument of require.context should
// be a string". This is the approach recommended in the Expo Router
// troubleshooting docs and makes the web build work with no env vars.

import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported for Fast Refresh to update the route context.
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
