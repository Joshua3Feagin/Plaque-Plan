/**
 * Seed consistency check (no backend needed).
 *
 * Prices the seeded Rivera household through the real engine to prove the seed
 * fixtures are shaped correctly and reproduce the Requirement 4.6 crown result
 * (owe $1,225, save $275, $925 left next year). Run with:
 *
 *   npm run check --workspace=packages/seed
 */
import { optimizeYear, projectedWaste, type MemberState, type PendingItem } from '@maxout/engine';
import { CATALOG, PLAN_BY_ID, DEMO_PLAN_ID } from './catalog';
import { HOUSEHOLD, MEMBERS, TREATMENT_ITEMS, DEMO_TODAY } from './household';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

const plan = PLAN_BY_ID.get(DEMO_PLAN_ID);
if (!plan) throw new Error(`Demo plan ${DEMO_PLAN_ID} not found in catalog.`);

// Every treatment item must reference a known procedure and a known member.
const memberKeys = new Set(MEMBERS.map((m) => m.key));
for (const item of TREATMENT_ITEMS) {
  assert(CATALOG.has(item.code), `treatment item ${item.key} references known code ${item.code}`);
  assert(memberKeys.has(item.memberKey), `treatment item ${item.key} references known member ${item.memberKey}`);
}

// Build engine MemberState from Sam and run the hero (crown) scenario in isolation.
const sam = MEMBERS.find((m) => m.key === 'sam')!;
const samState: MemberState = {
  memberId: sam.key,
  birthYear: sam.birthYear,
  enrolledOn: sam.enrolledOn,
  maxUsed: sam.maxUsed,
  deductibleMet: sam.deductibleMet,
  history: sam.history,
};

const samCrowns: PendingItem[] = TREATMENT_ITEMS.filter(
  (i) => i.memberKey === 'sam' && i.code === 'D2740',
).map((i) => ({
  id: i.key,
  memberId: sam.key,
  code: i.code,
  tooth: i.tooth,
  urgency: i.urgency,
  inNetwork: i.inNetwork,
}));

const crownResult = optimizeYear({
  plan,
  members: [samState],
  items: samCrowns,
  today: DEMO_TODAY,
  monthlyBudget: HOUSEHOLD.monthlyBudget,
  catalog: CATALOG,
});

console.log('\nCrown scenario (Sam, two D2740):');
console.log(`  totalOwed=${crownResult.totalOwed} savings=${crownResult.savings} nextYearMaxLeft=${crownResult.nextYearMaxLeft[sam.key]}`);

assert(crownResult.totalOwed === 1225, 'crown scenario total owed is $1,225 (Req 4.6)');
assert(crownResult.savings === 275, 'crown scenario savings is $275 (Req 4.6)');
assert(crownResult.nextYearMaxLeft[sam.key] === 925, "crown scenario leaves $925 of next year's max (Req 4.6)");

// Projected waste across the whole seeded household should be positive.
const allStates: MemberState[] = MEMBERS.map((m) => ({
  memberId: m.key,
  birthYear: m.birthYear,
  enrolledOn: m.enrolledOn,
  maxUsed: m.maxUsed,
  deductibleMet: m.deductibleMet,
  history: m.history,
}));
const waste = projectedWaste(plan, allStates, DEMO_TODAY);
console.log(`\nHousehold projected waste: $${waste.total} across ${MEMBERS.length} members, ${waste.daysLeft} days left`);
assert(waste.total > 0, 'household has unused benefit to optimize');
assert(waste.daysLeft > 0, 'demo date is before plan year end');

if (process.exitCode === 1) {
  console.error('\nSeed consistency check FAILED.');
} else {
  console.log('\nSeed consistency check passed.');
}
