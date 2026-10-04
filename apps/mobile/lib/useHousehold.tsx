// useHousehold(): the single source of household state for every tab.
//
// For the demo it is backed by the @maxout/seed fixtures held in local state, so
// Profile and Calendar are fully interactive before the Amplify backend is
// deployed. All money math goes through @maxout/engine — nothing here hard-codes
// a dollar figure. Any change to the pending treatment items re-runs optimizeYear
// (via useMemo), which is what keeps recommended visits in sync across tabs.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  estimateVisit,
  optimizeYear,
  projectedWaste,
  type LineInput,
  type MemberState,
  type Plan,
  type Procedure,
  type ScheduleResult,
  type Urgency,
} from '@maxout/engine';
import {
  CATALOG,
  PLAN_BY_ID,
  DEMO_PLAN_ID,
  DEMO_TODAY,
  HOUSEHOLD,
  MEMBERS,
  TREATMENT_ITEMS,
  type SeedMember,
  type SeedTreatmentItem,
  type Relation,
} from '@maxout/seed';

export type { Relation } from '@maxout/seed';

import { deriveVisits } from './visits';

/** A member as the UI consumes it. */
export interface Member {
  id: string;
  firstName: string;
  relation: Relation;
  birthYear: number;
  planId: string;
  enrolledOn: string;
  maxUsed: number;
  deductibleMet: number;
  history: { code: string; date: string; tooth?: string }[];
}

/** A pending treatment item as the UI consumes it. */
export interface TreatmentItem {
  id: string;
  memberId: string;
  code: string;
  tooth?: string;
  urgency: Urgency;
  inNetwork: boolean;
}

export interface AddMemberInput {
  firstName: string;
  relation: Relation;
  birthYear: number;
  planId: string;
}

export interface AddTreatmentItemInput {
  memberId: string;
  code: string;
  tooth?: string;
  urgency: Urgency;
  inNetwork?: boolean;
}

/** A calendar visit: a placed treatment item on a concrete date. */
export type VisitStatus = 'recommended' | 'scheduled';

export interface Visit {
  /** Stable id, derived from the treatment item it fulfils. */
  id: string;
  memberId: string;
  treatmentItemId: string;
  code: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  status: VisitStatus;
  memberOwes: number;
  reason: string;
}

export interface ScheduleVisitInput {
  memberId: string;
  treatmentItemId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
}

export interface HouseholdContextValue {
  loading: boolean;
  today: string;
  household: { name: string; monthlyBudget: number; planYearStartMonth: number };
  plan: Plan;
  catalog: Map<string, Procedure>;
  members: Member[];
  itemsByMember: (memberId: string) => TreatmentItem[];
  /** Optimizer result over all pending items (recommended schedule + savings). */
  schedule: ScheduleResult;
  /** Expiring-benefit projection for the household. */
  waste: { perMember: Record<string, number>; total: number; daysLeft: number };
  getMember: (memberId: string) => Member | undefined;
  memberState: (memberId: string) => MemberState | undefined;
  /** Remaining annual max for a member ("left to use"). */
  leftToUse: (memberId: string) => number;
  /** Price a visit for a member through the engine. */
  estimateFor: (memberId: string, lines: LineInput[]) => ReturnType<typeof estimateVisit> | undefined;
  addMember: (input: AddMemberInput) => string;
  addTreatmentItem: (input: AddTreatmentItemInput) => void;
  /** All visits: recommended (from optimizer) merged with scheduled overrides. */
  visits: Visit[];
  /** Visits on a given ISO date (YYYY-MM-DD). */
  visitsOn: (date: string) => Visit[];
  /** Accept a recommended visit, flipping it to scheduled (keeps its date). */
  acceptRecommendation: (visitId: string) => void;
  /** Schedule (or move) a visit to a date; used by the AI agent in Task 6. */
  scheduleVisit: (input: ScheduleVisitInput) => void;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

function toMember(seed: SeedMember): Member {
  return {
    id: seed.key,
    firstName: seed.firstName,
    relation: seed.relation,
    birthYear: seed.birthYear,
    planId: seed.planId,
    enrolledOn: seed.enrolledOn,
    maxUsed: seed.maxUsed,
    deductibleMet: seed.deductibleMet,
    history: seed.history,
  };
}

function toItem(seed: SeedTreatmentItem): TreatmentItem {
  return {
    id: seed.key,
    memberId: seed.memberKey,
    code: seed.code,
    tooth: seed.tooth,
    urgency: seed.urgency,
    inNetwork: seed.inNetwork,
  };
}

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(() => MEMBERS.map(toMember));
  const [items, setItems] = useState<TreatmentItem[]>(() => TREATMENT_ITEMS.map(toItem));
  // Overrides for visits the user (or agent) has scheduled, keyed by treatmentItemId.
  // A null date means "use the recommended date but mark it scheduled".
  const [scheduledOverrides, setScheduledOverrides] = useState<Record<string, { date: string | null }>>({});

  const plan = PLAN_BY_ID.get(DEMO_PLAN_ID)!;
  const catalog = CATALOG;
  const today = DEMO_TODAY;

  const toState = useCallback(
    (m: Member): MemberState => ({
      memberId: m.id,
      birthYear: m.birthYear,
      enrolledOn: m.enrolledOn,
      maxUsed: m.maxUsed,
      deductibleMet: m.deductibleMet,
      history: m.history,
    }),
    [],
  );

  const memberStates = useMemo<MemberState[]>(() => members.map(toState), [members, toState]);

  // Re-run the optimizer whenever members or pending items change.
  const schedule = useMemo<ScheduleResult>(
    () =>
      optimizeYear({
        plan,
        members: memberStates,
        items: items.map((i) => ({
          id: i.id,
          memberId: i.memberId,
          code: i.code,
          tooth: i.tooth,
          urgency: i.urgency,
          inNetwork: i.inNetwork,
        })),
        today,
        monthlyBudget: HOUSEHOLD.monthlyBudget,
        catalog,
      }),
    [plan, memberStates, items, today, catalog],
  );

  const waste = useMemo(() => projectedWaste(plan, memberStates, today), [plan, memberStates, today]);

  const getMember = useCallback((id: string) => members.find((m) => m.id === id), [members]);

  const memberState = useCallback(
    (id: string) => {
      const m = members.find((x) => x.id === id);
      return m ? toState(m) : undefined;
    },
    [members, toState],
  );

  const leftToUse = useCallback(
    (id: string) => {
      const m = members.find((x) => x.id === id);
      return m ? Math.max(0, plan.annualMax - m.maxUsed) : 0;
    },
    [members, plan.annualMax],
  );

  const itemsByMember = useCallback((id: string) => items.filter((i) => i.memberId === id), [items]);

  const estimateFor = useCallback(
    (id: string, lines: LineInput[]) => {
      const m = members.find((x) => x.id === id);
      if (!m) return undefined;
      return estimateVisit(plan, toState(m), lines, catalog);
    },
    [members, plan, catalog, toState],
  );

  const addMember = useCallback((input: AddMemberInput): string => {
    const id = `m-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    setMembers((prev) => [
      ...prev,
      {
        id,
        firstName: input.firstName,
        relation: input.relation,
        birthYear: input.birthYear,
        planId: input.planId,
        enrolledOn: DEMO_TODAY,
        maxUsed: 0,
        deductibleMet: 0,
        history: [],
      },
    ]);
    return id;
  }, []);

  const addTreatmentItem = useCallback((input: AddTreatmentItemInput) => {
    const id = `t-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        memberId: input.memberId,
        code: input.code,
        tooth: input.tooth,
        urgency: input.urgency,
        inNetwork: input.inNetwork ?? true,
      },
    ]);
  }, []);

  // Derive calendar visits from the optimizer placements. Each placement targets a
  // month (YYYY-MM); we anchor it to the 15th for a concrete date. If the user has
  // scheduled that item, apply the override (a chosen date and 'scheduled' status).
  const visits = useMemo<Visit[]>(
    () =>
      deriveVisits(
        schedule.placements,
        items.map((i) => ({ id: i.id, memberId: i.memberId, code: i.code })),
        scheduledOverrides,
      ),
    [schedule.placements, items, scheduledOverrides],
  );

  const visitsOn = useCallback((date: string) => visits.filter((v) => v.date === date), [visits]);

  const acceptRecommendation = useCallback(
    (visitId: string) => {
      const v = visits.find((x) => x.id === visitId);
      if (!v) return;
      // Keep the recommended date; just flip the status to scheduled.
      setScheduledOverrides((prev) => ({ ...prev, [v.treatmentItemId]: { date: v.date } }));
    },
    [visits],
  );

  const scheduleVisit = useCallback((input: ScheduleVisitInput) => {
    setScheduledOverrides((prev) => ({
      ...prev,
      [input.treatmentItemId]: { date: input.date },
    }));
  }, []);

  const value = useMemo<HouseholdContextValue>(
    () => ({
      loading: false,
      today,
      household: {
        name: HOUSEHOLD.name,
        monthlyBudget: HOUSEHOLD.monthlyBudget,
        planYearStartMonth: HOUSEHOLD.planYearStartMonth,
      },
      plan,
      catalog,
      members,
      itemsByMember,
      schedule,
      waste,
      getMember,
      memberState,
      leftToUse,
      estimateFor,
      addMember,
      addTreatmentItem,
      visits,
      visitsOn,
      acceptRecommendation,
      scheduleVisit,
    }),
    [
      today,
      plan,
      catalog,
      members,
      itemsByMember,
      schedule,
      waste,
      getMember,
      memberState,
      leftToUse,
      estimateFor,
      addMember,
      addTreatmentItem,
      visits,
      visitsOn,
      acceptRecommendation,
      scheduleVisit,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within a HouseholdProvider');
  return ctx;
}
