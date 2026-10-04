/**
 * Calendar accept-flow check (headless, no React/backend).
 *
 * Runs the REAL optimizer over the seeded Rivera household, derives calendar
 * visits with the SAME pure helper the app uses (apps/mobile/lib/visits.ts), then
 * simulates accepting a recommendation and asserts the visit flips from
 * 'recommended' to 'scheduled' while its amount (from the engine) is unchanged.
 *
 *   npx tsx scripts/calendar-check.ts   (from packages/seed)
 */
import { optimizeYear, type PendingItem, type MemberState } from '@maxout/engine';
import { CATALOG, PLAN_BY_ID, DEMO_PLAN_ID, HOUSEHOLD, MEMBERS, TREATMENT_ITEMS, DEMO_TODAY } from '../src/index';
import { deriveVisits, type ItemLite } from '../../../apps/mobile/lib/visits';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

const plan = PLAN_BY_ID.get(DEMO_PLAN_ID)!;

const memberStates: MemberState[] = MEMBERS.map((m) => ({
  memberId: m.key,
  birthYear: m.birthYear,
  enrolledOn: m.enrolledOn,
  maxUsed: m.maxUsed,
  deductibleMet: m.deductibleMet,
  history: m.history,
}));

const items: PendingItem[] = TREATMENT_ITEMS.map((i) => ({
  id: i.key,
  memberId: i.memberKey,
  code: i.code,
  tooth: i.tooth,
  urgency: i.urgency,
  inNetwork: i.inNetwork,
}));

const schedule = optimizeYear({
  plan,
  members: memberStates,
  items,
  today: DEMO_TODAY,
  monthlyBudget: HOUSEHOLD.monthlyBudget,
  catalog: CATALOG,
});

const itemsLite: ItemLite[] = TREATMENT_ITEMS.map((i) => ({ id: i.key, memberId: i.memberKey, code: i.code }));

// 1. Before accepting: every derived visit is 'recommended'.
let overrides: Record<string, { date: string | null }> = {};
let visits = deriveVisits(schedule.placements, itemsLite, overrides);

assert(visits.length === schedule.placements.length, 'one visit per optimizer placement');
assert(visits.length > 0, 'there are visits to show');
assert(visits.every((v) => v.status === 'recommended'), 'all visits start as recommended');
assert(
  visits.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v.date)),
  'every visit has a concrete YYYY-MM-DD date',
);

// 2. Accept the first recommendation (mirrors acceptRecommendation: keep date, flip status).
const target = visits[0];
const owedBefore = target.memberOwes;
overrides = { ...overrides, [target.treatmentItemId]: { date: target.date } };
visits = deriveVisits(schedule.placements, itemsLite, overrides);

const after = visits.find((v) => v.treatmentItemId === target.treatmentItemId)!;
assert(after.status === 'scheduled', 'accepted visit flips to scheduled');
assert(after.date === target.date, 'accepted visit keeps its recommended date');
assert(after.memberOwes === owedBefore, 'accepted visit keeps its engine-computed amount');
assert(
  visits.filter((v) => v.status === 'scheduled').length === 1,
  'exactly one visit is scheduled after accepting one',
);

// 3. scheduleVisit to a new date (agent path): moves and marks scheduled.
const moved = deriveVisits(schedule.placements, itemsLite, {
  [target.treatmentItemId]: { date: '2025-12-05' },
});
const movedVisit = moved.find((v) => v.treatmentItemId === target.treatmentItemId)!;
assert(movedVisit.date === '2025-12-05' && movedVisit.status === 'scheduled', 'scheduleVisit moves the visit and marks it scheduled');

console.log(`\nVisits derived: ${visits.length}. Scheduled after accept: ${visits.filter((v) => v.status === 'scheduled').length}.`);
if (process.exitCode === 1) console.error('\nCalendar accept-flow check FAILED.');
else console.log('\nCalendar accept-flow check passed.');
