# @maxout/seed

Seed data for the Plaque & Plan dental optimizer: the CDT procedure catalog, the two
sample plans, and the Rivera demo household (Requirement 1.3, 2.1–2.3).

All fixtures are typed against `@maxout/engine`, so the records written to the
backend price correctly with `estimateVisit` / `optimizeYear`.

## What's here

| File | Contents |
| --- | --- |
| `src/catalog.ts` | 16 CDT procedures (`PROCEDURES`, `CATALOG` map) and 2 plans (`PLANS`, `PLAN_BY_ID`). |
| `src/household.ts` | `HOUSEHOLD`, `MEMBERS` (Sam, Jordan, Maya, Leo), `TREATMENT_ITEMS`, and `DEMO_TODAY` (Nov 10). |
| `src/check.ts` | Offline consistency check: prices the seed through the engine, reproduces the Req 4.6 crown result. |
| `src/seed.ts` | Writes the seed to a deployed Amplify sandbox via the Data client. |

## Verify the seed (no backend needed)

```bash
npm run typecheck --workspace=packages/seed   # types match the engine
npm run check     --workspace=packages/seed   # engine reproduces owe $1,225 / save $275 / $925 left
```

The check asserts the Requirement 4.6 scenario (Sam's two crowns) and that the
household has benefit left to optimize before the plan year ends.

## Populate the backend

1. Start the sandbox so Amplify writes `amplify_outputs.json` to the repo root:

   ```bash
   npm run sandbox        # from the repo root (npx ampx sandbox)
   ```

2. Create the judge user once (Cognito user pool or the app's sign-up flow).

3. Run the seed with the judge credentials in the environment — they are **never
   committed**; put them in the submission only:

   ```bash
   # macOS/Linux
   JUDGE_EMAIL=judge@example.com JUDGE_PASSWORD='…' npm run seed --workspace=packages/seed

   # Windows PowerShell
   $env:JUDGE_EMAIL='judge@example.com'; $env:JUDGE_PASSWORD='…'; npm run seed --workspace=packages/seed
   ```

The script signs in as the judge, then creates the plans and procedures (shared,
authenticated-read), the Rivera household, its members (with prior `Usage` from
each member's history), and the pending treatment items — all owned by the judge
account so owner authorization (Requirement 1.2) attaches correctly.
