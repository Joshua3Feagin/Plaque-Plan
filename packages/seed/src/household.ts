// Plaque & Plan seed: the Rivera demo household (Requirement 1.3, design seed notes).
//
// Demo date is fixed at November 10 (see DEMO_TODAY). Member state here mirrors
// the engine MemberState shape; treatment items mirror PendingItem so the
// optimizer can run directly against seeded records.

import type { Urgency } from '@maxout/engine';
import { DEMO_PLAN_ID } from './catalog';

/** Fixed "today" for the demo so estimates/optimizer output are reproducible. */
export const DEMO_TODAY = '2025-11-10';

/** Household-level settings. */
export const HOUSEHOLD = {
  name: 'Rivera',
  monthlyBudget: 150,
  planYearStartMonth: 1, // matches Sample PPO Plus
  planId: DEMO_PLAN_ID,
} as const;

export type Relation = 'self' | 'spouse' | 'child';

/** A seeded family member (maps to the Member model + engine MemberState). */
export interface SeedMember {
  /** Stable local key used to wire treatment items before DB ids exist. */
  key: string;
  firstName: string;
  relation: Relation;
  birthYear: number;
  planId: string;
  enrolledOn: string;
  maxUsed: number;
  deductibleMet: number;
  /** Prior usage this plan year (drives frequency checks). */
  history: { code: string; date: string; tooth?: string }[];
}

/** A seeded pending treatment item (maps to TreatmentItem + engine PendingItem). */
export interface SeedTreatmentItem {
  /** Stable local key. */
  key: string;
  memberKey: string;
  code: string;
  tooth?: string;
  urgency: Urgency;
  inNetwork: boolean;
}

const PPO = DEMO_PLAN_ID;
const ENROLLED = '2025-01-01';

/**
 * Members:
 * - Sam (self, 1988): $600 of max used, deductible met, two flexible crowns, one
 *   cleaning left (used one already this year).
 * - Jordan (spouse, 1990): nothing used, two cleanings unused.
 * - Maya (child, 2014): two sealants and a fluoride due.
 * - Leo (child, 2019): one cleaning left (used one already).
 */
export const MEMBERS: SeedMember[] = [
  {
    key: 'sam',
    firstName: 'Sam',
    relation: 'self',
    birthYear: 1988,
    planId: PPO,
    enrolledOn: ENROLLED,
    maxUsed: 600,
    deductibleMet: 50, // Sample PPO Plus deductible is $50 -> fully met
    history: [{ code: 'D1110', date: '2025-04-14' }],
  },
  {
    key: 'jordan',
    firstName: 'Jordan',
    relation: 'spouse',
    birthYear: 1990,
    planId: PPO,
    enrolledOn: ENROLLED,
    maxUsed: 0,
    deductibleMet: 0,
    history: [],
  },
  {
    key: 'maya',
    firstName: 'Maya',
    relation: 'child',
    birthYear: 2014,
    planId: PPO,
    enrolledOn: ENROLLED,
    maxUsed: 0,
    deductibleMet: 0,
    history: [{ code: 'D1120', date: '2025-03-02' }],
  },
  {
    key: 'leo',
    firstName: 'Leo',
    relation: 'child',
    birthYear: 2019,
    planId: PPO,
    enrolledOn: ENROLLED,
    maxUsed: 0,
    deductibleMet: 0,
    history: [{ code: 'D1120', date: '2025-02-20' }],
  },
];

/**
 * Pending care. Sam's two crowns are the hero scenario (one this year, one next);
 * the kids' preventive work is what the AI agent schedules before year end.
 */
export const TREATMENT_ITEMS: SeedTreatmentItem[] = [
  // Sam: two flexible crowns on different teeth, plus the second cleaning.
  { key: 'sam-crown-1', memberKey: 'sam', code: 'D2740', tooth: '14', urgency: 'flexible', inNetwork: true },
  { key: 'sam-crown-2', memberKey: 'sam', code: 'D2740', tooth: '3', urgency: 'flexible', inNetwork: true },
  { key: 'sam-cleaning-2', memberKey: 'sam', code: 'D1110', urgency: 'flexible', inNetwork: true },

  // Jordan: two cleanings unused this year.
  { key: 'jordan-cleaning-1', memberKey: 'jordan', code: 'D1110', urgency: 'flexible', inNetwork: true },
  { key: 'jordan-cleaning-2', memberKey: 'jordan', code: 'D1110', urgency: 'flexible', inNetwork: true },

  // Maya: two sealants (different teeth) and a fluoride.
  { key: 'maya-sealant-1', memberKey: 'maya', code: 'D1351', tooth: '19', urgency: 'flexible', inNetwork: true },
  { key: 'maya-sealant-2', memberKey: 'maya', code: 'D1351', tooth: '30', urgency: 'flexible', inNetwork: true },
  { key: 'maya-fluoride', memberKey: 'maya', code: 'D1206', urgency: 'flexible', inNetwork: true },

  // Leo: the second cleaning of the year.
  { key: 'leo-cleaning-2', memberKey: 'leo', code: 'D1120', urgency: 'flexible', inNetwork: true },
];
