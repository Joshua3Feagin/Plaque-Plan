# Mac demo — one browser, no Xcode, no networking

This runs the whole Plaque & Plan demo on **one Mac, in a browser**. There is
**no phone, no QR code, no LAN, and no Xcode** required — only Node.js. The app
is wrapped in an **iPhone frame** on web, so it still looks like an iPhone app.

It runs in **demo mode** (seeded Rivera family, every screen interactive, no
sign-in, no AWS). Everything is served from `localhost`, so the secure/locked-down
Wi-Fi is never involved.

> Why browser instead of the iOS Simulator: the Simulator needs Xcode, which we
> can't install on this Mac. The web build (via `react-native-web`) gives us the
> same screens with an iPhone-shaped frame around them, and needs nothing but a
> browser.

---

## One-time Mac setup

1. **Install Node 18+** (Node 24 is fine).
   - Download the LTS installer from <https://nodejs.org>, or with Homebrew:
     ```bash
     brew install node
     ```
   - Verify:
     ```bash
     node -v
     npm -v
     ```

2. **Get the code and install dependencies.**
   - Use **one** copy of the repo — the **top-level** project (the folder that has
     `apps/`, `packages/`, and `amplify/` directly inside it). Ignore any nested
     `Plaque-Plan/` duplicate.
   - From the project root:
     ```bash
     npm install
     ```

That's the whole setup. No Xcode, no Watchman, no simulators.

---

## Run the demo

From the project root:

```bash
npm run demo
```

That runs `expo start --web`. When it finishes bundling:

- It prints a local URL (usually `http://localhost:8081`).
- Press **`w`** in the terminal to open it in your browser, or just open the URL.

What you should see in the browser:

- An **iPhone-shaped frame** (rounded corners + notch) centered on the page.
- Inside it, the app loads into the **Profile** tab with the **Rivera family**.
- A small banner reads "Demo mode — showing the sample Rivera family."
- Two tabs work: **Profile** and **Calendar**.
- The estimate flow is two taps: **Profile → tap a member → Estimate a visit.**

For the cleanest look during the demo, make the browser window tall enough to
show the whole phone, and hide the browser toolbar (or use full-screen).

---

## Tips for a convincing iPhone look

The in-app iPhone frame already makes it read as a phone. To go further:

- **Full-screen the browser** (`⌃⌘F` in Safari/Chrome) so only the phone shows.
- Optionally use the browser's device toolbar for an exact iPhone resolution:
  - Chrome: open DevTools → Device Toolbar (the phone icon) → pick **iPhone 15**.
  - Safari: Develop menu → **Enter Responsive Design Mode** → pick an iPhone.
- Zoom the page (`⌘ +` / `⌘ -`) to fit the phone to your screen height.

---

## Nothing to configure for networking

- No `.env`, no IP addresses, no tunnels, no QR codes, no second device.
- Demo mode needs **no AWS and no backend**. The "Ask the scheduling assistant"
  box shows a friendly "not connected" message — that's expected without a
  backend.

---

## Optional: verify the logic without any UI

These run locally and need no browser or network:

```bash
npm test --workspace=packages/engine      # engine unit tests
npm run typecheck --workspace=apps/mobile  # app typecheck (tsc --noEmit)
```

To confirm the web build itself is healthy (produces a static site):

```bash
cd apps/mobile
npx expo export --platform web      # writes a dist/ folder with index.html
```

---

## Troubleshooting

- **Blank page / stuck on splash** — wait for the first bundle to finish (the
  terminal prints "Web Bundled …"), then reload the browser tab.
- **Port already in use** — run `npx expo start --web --port 8082` from
  `apps/mobile`, then open that port.
- **Changes not showing** — stop the server and restart with a clean cache:
  `npx expo start --web --clear`.
- **Module resolution errors after copying folders** — make sure you're in the
  **top-level** project (not the nested `Plaque-Plan/` copy), delete the root
  `node_modules`, and run `npm install` again.
- **OneDrive note** — if the project lives in a OneDrive folder, pause OneDrive
  sync while installing/running so it doesn't lock files inside `node_modules`.

---

## What makes the web build work (for maintainers)

A few project settings make the browser build reliable; don't remove them:

- **`apps/mobile/index.js`** registers the router with a literal
  `require.context('./app')` (and `package.json` `main` points to it). This
  avoids a monorepo-only failure where the app root couldn't be inlined into
  expo-router's `require.context` on web.
- **`apps/mobile/metro.config.js`** keeps hierarchical module lookup **on** and
  enables package `exports`, so `aws-amplify`'s nested subpaths (e.g.
  `@aws-amplify/auth/cognito`) resolve in the web bundler.
- **Root `package.json` `overrides`** pin `@babel/types` / `@babel/generator` to
  a modern version. A backend tool (`@aws-amplify/backend-cli`) otherwise pulls a
  broken old `@babel/types` to the root, which crashes the Reanimated Babel
  plugin during the web bundle.
- **`apps/mobile/components/PhoneFrame.tsx`** draws the iPhone frame on web only;
  on native it's a passthrough.
