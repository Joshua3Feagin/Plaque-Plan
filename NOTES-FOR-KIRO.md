# Notes for Kiro

Items I spotted while building the benefit-reminder feature. These are in your lane — I did NOT fix them.

## 1. `app/index.tsx` redirects to `/(tabs)/home` but `/(tabs)/home` tab works
No action needed — just noting the redirect is correct after your tab rename.

## 2. `brand.accentContainer` referenced in `home.tsx` styles
`theme/colors.ts` now exports `brand.accentContainer`. Confirmed it is defined — no issue.

## 3. `app/(tabs)/benefits/[category].tsx` — not inspected
I didn't read this file to stay in my lane. If it imports from `lib/benefits.ts`, make sure that file exports what the screen expects.

## 4. Signing-in user email not stored globally
`SignInScreen` captures an `email` field locally but doesn't persist it.
The benefit-reminder banner uses `DEMO_USER.email` from the seed as a workaround.
If you wire up real Cognito auth, consider exposing `currentUserEmail()` from `lib/amplify.ts`
so the banner can read the real recipient address without needing changes to the seed file.

## 5. `app/_layout.tsx` imports `PhoneFrame` — not in original file list
Confirmed it exists in `components/PhoneFrame.tsx`. No issue.
