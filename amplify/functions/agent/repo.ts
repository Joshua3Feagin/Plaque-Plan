// AppSync-backed HouseholdRepo. Loads the caller's household from stored records
// and writes scheduled visits. The owner is the caller's Cognito sub, taken from
// the Lambda event identity — never from client input.
//
// Plan.rules and Procedure.data hold the engine Plan/Procedure JSON, so we can
// price with @maxout/engine directly from the database.

import type { Plan, Procedure, MemberState, PendingItem } from '@maxout/engine';
import { estimateVisit } from '@maxout/engine';
import type { HouseholdData, HouseholdRepo, ScheduledVisit } from './tools';

/** Minimal shape of the Amplify data client models we use. */
export interface DataModels {
  Household: ModelOps;
  Member: ModelOps;
  Plan: ModelOps;
  Procedure: ModelOps;
  TreatmentItem: ModelOps;
  Visit: ModelOps;
}
interface ModelOps {
  list: (args?: any) => Promise<{ data: any[] }>;
  get?: (args: any) => Promise<{ data: any }>;
  create: (args: any) => Promise<{ data: any }>;
  update: (args: any) => Promise<{ data: any }>;
}

export class AppSyncHouseholdRepo implements HouseholdRepo {
  private cache?: HouseholdData;

  constructor(
    private readonly models: DataModels,
    private readonly ownerSub: string,
    private readonly today: string,
  ) {}

  async load(): Promise<HouseholdData> {
    if (this.cache) return this.cache;

    // Owner rules scope list() to this caller, so we read the caller's household.
    const [households, members, plans, procedures, items] = await Promise.all([
      this.models.Household.list(),
      this.models.Member.list(),
      this.models.Plan.list(),
      this.models.Procedure.list(),
      this.models.TreatmentItem.list(),
    ]);

    const household = households.data[0];
    if (!household) {
      throw new Error('No household found for this account.');
    }

    const planRecord = plans.data[0];
    const plan = (planRecord?.rules as Plan) ?? FALLBACK_PLAN;

    const catalog = new Map<string, Procedure>();
    for (const p of procedures.data) {
      const proc = (p.data as Procedure) ?? undefined;
      if (proc?.code) catalog.set(proc.code, proc);
    }

    const memberStates: HouseholdData['members'] = members.data.map((m: any) => ({
      memberId: m.id,
      firstName: m.firstName,
      relation: m.relation ?? 'child',
      birthYear: m.birthYear ?? 2000,
      enrolledOn: m.enrolledOn ?? `${new Date().getFullYear()}-01-01`,
      maxUsed: m.maxUsed ?? 0,
      deductibleMet: m.deductibleMet ?? 0,
      history: [],
    }));

    const pendingItems: PendingItem[] = items.data
      .filter((it: any) => it.status !== 'done')
      .map((it: any) => ({
        id: it.id,
        memberId: it.memberId,
        code: it.code,
        tooth: it.tooth ?? undefined,
        urgency: (it.urgency as PendingItem['urgency']) ?? 'flexible',
        inNetwork: it.inNetwork ?? true,
      }));

    this.cache = {
      household: {
        id: household.id,
        name: household.name ?? 'Your family',
        monthlyBudget: household.monthlyBudget ?? 150,
        planYearStartMonth: household.planYearStartMonth ?? plan.planYearStartMonth,
      },
      plan,
      catalog,
      members: memberStates,
      items: pendingItems,
      today: this.today,
    };
    return this.cache;
  }

  async scheduleVisit(input: {
    memberId: string;
    treatmentItemId: string;
    date: string;
  }): Promise<ScheduledVisit> {
    const hh = await this.load();
    const member = hh.members.find((m) => m.memberId === input.memberId);
    const item = hh.items.find((it) => it.id === input.treatmentItemId);

    // Price the booked visit through the engine so the stored amount is accurate.
    let memberOwes = 0;
    if (member && item) {
      const est = estimateVisit(
        hh.plan,
        member,
        [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: input.date }],
        hh.catalog,
      );
      memberOwes = est.total.member;
    }

    // Move an existing recommended visit for this item, or create a scheduled one.
    const existing = await this.models.Visit.list();
    const match = existing.data.find((v: any) => v.treatmentItemId === input.treatmentItemId);

    let saved: any;
    if (match) {
      ({ data: saved } = await this.models.Visit.update({
        id: match.id,
        date: input.date,
        status: 'scheduled',
        memberOwes,
      }));
    } else {
      ({ data: saved } = await this.models.Visit.create({
        memberId: input.memberId,
        treatmentItemId: input.treatmentItemId,
        date: input.date,
        status: 'scheduled',
        memberOwes,
      }));
    }

    return {
      id: saved?.id ?? `v-${input.treatmentItemId}`,
      memberId: input.memberId,
      treatmentItemId: input.treatmentItemId,
      date: input.date,
      status: 'scheduled',
      memberOwes,
    };
  }
}

/** Used only if no Plan record exists yet; keeps the agent from crashing. */
const FALLBACK_PLAN: Plan = {
  id: 'fallback',
  name: 'Your plan',
  planYearStartMonth: 1,
  annualMax: 1500,
  deductible: 50,
  deductibleWaivedFor: ['preventive'],
  coinsIn: { preventive: 1.0, basic: 0.8, major: 0.5 },
  coinsOut: { preventive: 1.0, basic: 0.7, major: 0.4 },
};
