# Plaque & Plan — Dental Benefits Optimizer

Plaque & Plan helps a family get the most out of their dental insurance. It prices
procedures before the visit, tracks each person's annual maximum, and schedules
care across the plan year so the maximum is used and the monthly budget is
respected. An AI care agent on Amazon Bedrock answers "when should we go and what
will it cost?" by calling a deterministic cost engine — the AI never computes
money itself.

Built for codeLinc 11 (Lincoln Financial + AWS), Path 1 Dental Benefits Optimizer.

## Monorepo layout

```
packages/engine   Deterministic cost engine (estimateVisit, optimizeYear, projectedWaste). Vitest.
packages/seed     CDT catalog, 2 plans, Rivera demo household; seed script + consistency checks.
apps/mobile       Expo (React Native, Expo Router, React Native Paper) app: Profile + Calendar tabs.
amplify           Amplify Gen 2 backend: Cognito auth, Data (AppSync/DynamoDB), Bedrock agent Lambda.
```

All money math lives in `packages/engine` and is imported by both the app
(instant, offline estimates) and the agent Lambda (tool calls), so every dollar
figure is deterministic and traceable to a plan field.

## Prerequisites

- Node 18+ (built on Node 24)
- An AWS account with Amazon Bedrock access to a Claude model (for the agent)
- Expo Go on a phone, or an EAS account for update links

## Install

```bash
npm install
```

## Run the app (demo mode, no backend)

```bash
npm run dev            # expo start, from apps/mobile
```

Scan the QR code with Expo Go. With no backend deployed, the app runs in **demo
mode**: it skips sign-in and shows the seeded Rivera family so every screen is
usable. The Ask box shows a friendly "not connected" message until the backend
is deployed.

Verify the estimate is at most two taps from Profile: Profile → tap a member →
**Estimate a visit** (Requirement 7.2).

## Verify the engine and seed (no backend needed)

```bash
npm test --workspace=packages/engine        # 10 engine unit tests, incl. the Req 4.6 crown example
npm run check --workspace=packages/seed      # seed reproduces owe $1,225 / save $275 / $925 left
npx vitest run --root amplify                # agent Converse-loop + tool-dispatch tests (mocked Bedrock)
```

Typecheck everything:

```bash
npm run typecheck --workspace=apps/mobile
( cd amplify && npx tsc --noEmit -p tsconfig.json )
```

## Deploy the backend (Cognito + Data + Bedrock agent)

```bash
npm run sandbox        # npx ampx sandbox — provisions auth, data, and the agent Lambda
```

This writes `amplify_outputs.json` to the repo root. Restart the app
(`npm run dev`) and it will:

- require Cognito sign-in (the Amplify Authenticator, Requirement 1.1), and
- enable the live Ask box backed by Bedrock.

The agent Lambda needs Bedrock access to a Claude model in your region. Set the
model/region in `amplify/functions/agent/resource.ts` (`BEDROCK_MODEL_ID`,
`BEDROCK_REGION`) to a model enabled in your account. The backend grants the
Lambda least-privilege `bedrock:InvokeModel` on Anthropic models only.

## Seed the demo household + judge login

1. Create the judge user once (Cognito user pool, or the app's sign-up screen).
2. Seed with the judge credentials in the environment (never committed):

   ```bash
   # Windows PowerShell
   $env:JUDGE_EMAIL='judge@example.com'; $env:JUDGE_PASSWORD='…'
   npm run seed --workspace=packages/seed

   # macOS/Linux
   JUDGE_EMAIL=judge@example.com JUDGE_PASSWORD='…' npm run seed --workspace=packages/seed
   ```

This signs in as the judge and creates the plans, procedures, and the Rivera
household (owned by the judge account). See `packages/seed/README.md` for details.

### Judge login (for submission)

Put the judge email/password in the **submission form only** — not in the repo.
To verify: open the app with the deployed backend, sign in as the judge, and
confirm the Rivera family loads on the Profile tab.

## Publish an EAS Update (shareable link for judges)

```bash
cd apps/mobile
npx eas login
npx eas update:configure          # first time only
npx eas update --branch production --message "codeLinc demo"
```

Share the resulting Expo update link (opens in Expo Go). As a web fallback:

```bash
npx expo export --platform web
# then host the apps/mobile/dist output (e.g. Amplify Hosting)
```

## Status / what's verified here

| Area | Status |
| --- | --- |
| Engine (estimate, optimizer, waste) | ✅ 10 unit tests pass, incl. Req 4.6 crown example |
| Seed data (catalog, plans, Rivera) | ✅ consistency check reproduces 1,225 / 275 / 925 |
| Agent Converse loop + tools | ✅ 5 tests pass with a mocked Bedrock (loop, tool dispatch, cards, cap, errors) |
| App + backend TypeScript | ✅ `tsc --noEmit` clean |
| Live Bedrock call, device run, EAS publish, judge sign-in | ⚠️ require a deployed backend / phone / EAS account (not run in CI here) |
```
