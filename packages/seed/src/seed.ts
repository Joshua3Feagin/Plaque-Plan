/**
 * MaxOut seed script.
 *
 * Populates a deployed Amplify sandbox with:
 *   - the CDT procedure catalog (shared, authenticated-read)
 *   - the two sample plans
 *   - the Rivera demo household owned by the judge account
 *
 * Owner-scoped records (Household, Member, TreatmentItem) are created while
 * signed in as the judge user so Amplify's owner authorization attaches the
 * right owner. Shared records (Plan, Procedure) are created the same way; their
 * auth rules also allow authenticated reads for everyone.
 *
 * Usage (after `npx ampx sandbox` has generated amplify_outputs.json at repo root):
 *
 *   JUDGE_EMAIL=judge@example.com JUDGE_PASSWORD='…' npm run seed --workspace=packages/seed
 *
 * Credentials come from the environment and are never committed. If the judge
 * user does not exist yet, create it once in the Cognito user pool (or via the
 * Amplify Authenticator sign-up flow) before running this.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { Amplify } from 'aws-amplify';
import { signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';

import {
  PLANS,
  PROCEDURES,
  HOUSEHOLD,
  MEMBERS,
  TREATMENT_ITEMS,
  type SeedMember,
} from './index';

// --- Config / outputs -------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUTS_PATH = resolve(__dirname, '../../../amplify_outputs.json');

function loadOutputs(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(OUTPUTS_PATH, 'utf8'));
  } catch {
    throw new Error(
      `Could not read ${OUTPUTS_PATH}. Run \`npx ampx sandbox\` first so Amplify ` +
        `writes amplify_outputs.json to the repo root.`,
    );
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}. See the header of seed.ts.`);
  return v;
}

// --- Seed routine -----------------------------------------------------------

async function main(): Promise<void> {
  const email = requireEnv('JUDGE_EMAIL');
  const password = requireEnv('JUDGE_PASSWORD');

  Amplify.configure(loadOutputs() as never);

  // Sign in as the judge so owner-based records attach to that identity.
  await signOut().catch(() => {});
  const { isSignedIn } = await signIn({ username: email, password });
  if (!isSignedIn) throw new Error('Judge sign-in did not complete (check credentials / MFA).');
  console.log(`Signed in as ${email}`);

  const client = generateClient<Record<string, never>>();
  // Loosely typed to avoid a hard dependency on generated Schema types in the
  // seed package; the field names below match amplify/data/resource.ts.
  const models = (client as unknown as { models: Record<string, any> }).models;

  // 1. Plans — store the engine Plan object in `rules`.
  console.log(`Seeding ${PLANS.length} plans…`);
  for (const plan of PLANS) {
    await models.Plan.create({
      name: plan.name,
      carrier: 'Sample Carrier',
      rules: plan as unknown as object, // engine Plan shape
    });
  }

  // 2. Procedures — store the engine Procedure object in `data`.
  console.log(`Seeding ${PROCEDURES.length} procedures…`);
  for (const proc of PROCEDURES) {
    await models.Procedure.create({
      code: proc.code,
      name: proc.name,
      plainName: proc.plainName,
      tier: proc.tier,
      data: proc as unknown as object, // engine Procedure shape
    });
  }

  // 3. Household (owner = judge).
  console.log(`Seeding household "${HOUSEHOLD.name}"…`);
  const { data: household } = await models.Household.create({
    name: HOUSEHOLD.name,
    monthlyBudget: HOUSEHOLD.monthlyBudget,
    planYearStartMonth: HOUSEHOLD.planYearStartMonth,
  });
  if (!household) throw new Error('Household create returned no data.');

  // 4. Members. Keep a local key -> created id map to wire treatment items.
  const memberIdByKey = new Map<string, string>();
  console.log(`Seeding ${MEMBERS.length} members…`);
  for (const m of MEMBERS as SeedMember[]) {
    const { data: member } = await models.Member.create({
      householdId: household.id,
      firstName: m.firstName,
      relation: m.relation,
      birthYear: m.birthYear,
      planId: m.planId,
      enrolledOn: m.enrolledOn,
      maxUsed: m.maxUsed,
      deductibleMet: m.deductibleMet,
    });
    if (!member) throw new Error(`Member create returned no data for ${m.firstName}.`);
    memberIdByKey.set(m.key, member.id);

    // Seed prior usage so frequency checks reflect what's already happened.
    for (const h of m.history) {
      await models.Usage.create({
        memberId: member.id,
        date: h.date,
        code: h.code,
        tooth: h.tooth,
        insurerPaid: 0,
        memberPaid: 0,
      });
    }
  }

  // 5. Pending treatment items.
  console.log(`Seeding ${TREATMENT_ITEMS.length} treatment items…`);
  for (const item of TREATMENT_ITEMS) {
    const memberId = memberIdByKey.get(item.memberKey);
    if (!memberId) throw new Error(`No member seeded for key ${item.memberKey}.`);
    await models.TreatmentItem.create({
      memberId,
      code: item.code,
      tooth: item.tooth,
      urgency: item.urgency,
      status: 'planned',
      inNetwork: item.inNetwork,
    });
  }

  await signOut();
  console.log('Seed complete. Signed out.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
