# Implementation Plan

24-hour build, team of 3. Tasks 1-7 are the whole app. Feature freeze at 4am ET; submit by 10am ET Oct 4.

- [ ] 1. Scaffold app and backend
  - `npx create-expo-app` (TypeScript, Expo Router), React Native Paper, react-native-svg; `theme/colors.ts` with the Lincoln Financial tokens from brand.md
  - Amplify Gen 2 backend with Cognito; React Native Authenticator; run in Expo Go on a phone
  - _Requirements: 1.1, 7.1_

- [ ] 2. Data schema and seed
  - Household, Member, Plan, Procedure, TreatmentItem, Visit, Usage models with owner rules
  - Seed: ~15 CDT codes, 2 plans, Rivera household (demo date Nov 10), judge login
  - _Requirements: 1.2, 1.3, 2.1-2.3_

- [ ] 3. Cost engine (`packages/engine`) with Vitest
  - [ ] 3.1 `estimateVisit`: deductible, coinsurance, annual max cap, frequency check, network toggle, templated explanation
    - _Requirements: 3.2-3.5_
  - [ ] 3.2 `optimizeYear`: urgent first, this year vs next year search, monthly budget, tie-break, savings and reasons; `projectedWaste`
    - _Requirements: 4.1-4.5_
  - [ ] 3.3 Tests including the crown example (owe $1,225, save $275, $925 left next year)
    - _Requirements: 4.6_

- [ ] 4. Bottom tabs and Profile tab
  - Bottom tab bar: Profile, Calendar
  - Household screen: banner (expiring benefits, savings), member list with gauges, Add family member form
  - Member profile: gauge, next visit, care plan with add item (urgency) that re-runs the optimizer, history, "Estimate a visit" sheet (search, per-line table, network toggle)
  - _Requirements: 5.1-5.5, 2.4, 3.1-3.5, 4.4, 4.5_

- [ ] 5. Calendar tab
  - Month view (react-native-calendars) with recommended vs scheduled visits per member color; day list with who/what/you owe; accept recommendation
  - Visit model (memberId, treatmentItemId, date, status recommended/scheduled)
  - _Requirements: 6.1, 6.2_

- [ ] 6. AI scheduling agent
  - Lambda with Bedrock Converse tool loop: getHousehold, estimateVisit, optimizeYear, scheduleVisit (writes Visit); system prompt rules
  - "Ask" box on Calendar with text + simple cards; calendar refreshes after scheduleVisit; error state
  - _Requirements: 6.3-6.6_

- [ ] 7. Polish and ship
  - Loading/empty states, plain-language copy pass, test on iPhone and Android, publish EAS Update, verify judge login
  - _Requirements: 7.2-7.4_
