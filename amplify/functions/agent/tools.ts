// Agent tools: the four functions the model can call. Each returns plain JSON.
// All money math goes through @maxout/engine — tools never invent numbers.
//
// The data access is behind a small HouseholdRepo interface so the Converse loop
// and tool dispatch can be unit-tested with an in-memory repo (no AppSync).

import {
  estimateVisit,
  optimizeYear,
  projectedWaste,
  type Plan,
  type Procedure,
  type MemberState,
  type PendingItem,
  type LineInput,
} from '@maxout/engine';

/** What a tool needs to read/write, abstracted from AppSync. */
export interface HouseholdRepo {
  /** Load the caller's household (resolved from identity, not client input). */
  load(): Promise<HouseholdData>;
  /** Create or move a scheduled visit; returns the stored visit. */
  scheduleVisit(input: {
    memberId: string;
    treatmentItemId: string;
    date: string;
  }): Promise<ScheduledVisit>;
}

export interface HouseholdData {
  household: { id: string; name: string; monthlyBudget: number; planYearStartMonth: number };
  plan: Plan;
  catalog: Map<string, Procedure>;
  members: (MemberState & { firstName: string; relation: string })[];
  items: PendingItem[];
  today: string;
}

export interface ScheduledVisit {
  id: string;
  memberId: string;
  treatmentItemId: string;
  date: string;
  status: 'scheduled';
  memberOwes: number;
}

/** A card to render in the app. */
export interface AgentCard {
  type: 'estimate' | 'schedule';
  data: unknown;
}

/** Side-channel: tool runs can emit cards the app should render. */
export interface ToolContext {
  cards: AgentCard[];
}

/** Bedrock Converse toolSpec list (JSON schema inputs). */
export const TOOL_SPECS = [
  {
    toolSpec: {
      name: 'getHousehold',
      description:
        "Load the signed-in user's household: members (with how much of their annual max is used and their deductible met), the plan summary, the monthly budget, and each member's pending treatment items. Call this first to learn names, ids, and what care is pending.",
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            memberId: { type: 'string', description: 'Optional: focus on one member id.' },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'estimateVisit',
      description:
        'Estimate what a visit costs for one member. Returns per-line insurer pays / member owes and a total. Use this for any single-visit cost question. Never compute dollars yourself.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            memberId: { type: 'string' },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', description: 'CDT code, e.g. D1110.' },
                  tooth: { type: 'string' },
                  inNetwork: { type: 'boolean' },
                },
                required: ['code', 'inNetwork'],
              },
            },
          },
          required: ['memberId', 'lines'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'optimizeYear',
      description:
        "Optimize when the family should get pending care across this year and next to minimize what they owe and avoid wasting the annual maximum. Returns per-item month placements, total owed, savings vs booking everything now, and next year's remaining max. Use for any 'when should we go' or scheduling question.",
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            memberIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'scheduleVisit',
      description:
        'Book or move a visit on the calendar for a member on a specific date (YYYY-MM-DD). Only call after you know the member id and the treatment item id from getHousehold or optimizeYear.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            memberId: { type: 'string' },
            treatmentItemId: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['memberId', 'treatmentItemId', 'date'],
        },
      },
    },
  },
] as const;

/**
 * Dispatch a single tool call. Returns a JSON-serializable result for the model.
 * Emits cards into ctx when a tool produces something the app should render.
 */
export async function runTool(
  name: string,
  input: Record<string, unknown>,
  repo: HouseholdRepo,
  ctx: ToolContext,
): Promise<unknown> {
  const hh = await repo.load();

  switch (name) {
    case 'getHousehold': {
      const memberId = typeof input.memberId === 'string' ? input.memberId : undefined;
      const members = hh.members
        .filter((m) => !memberId || m.memberId === memberId)
        .map((m) => ({
          id: m.memberId,
          firstName: m.firstName,
          relation: m.relation,
          leftToUse: Math.max(0, hh.plan.annualMax - m.maxUsed),
          deductibleLeft: Math.max(0, hh.plan.deductible - m.deductibleMet),
          pendingItems: hh.items
            .filter((it) => it.memberId === m.memberId)
            .map((it) => ({
              treatmentItemId: it.id,
              code: it.code,
              name: hh.catalog.get(it.code)?.plainName ?? it.code,
              tooth: it.tooth,
              urgency: it.urgency,
            })),
        }));
      const waste = projectedWaste(
        hh.plan,
        hh.members.map((m) => m),
        hh.today,
      );
      return {
        today: hh.today,
        plan: { name: hh.plan.name, annualMax: hh.plan.annualMax, deductible: hh.plan.deductible },
        monthlyBudget: hh.household.monthlyBudget,
        expiring: { total: waste.total, daysLeft: waste.daysLeft },
        members,
      };
    }

    case 'estimateVisit': {
      const memberId = String(input.memberId ?? '');
      const member = hh.members.find((m) => m.memberId === memberId);
      if (!member) return { error: `Unknown member ${memberId}` };
      const rawLines = Array.isArray(input.lines) ? input.lines : [];
      const lines: LineInput[] = rawLines.map((l: any) => ({
        code: String(l.code),
        tooth: l.tooth ? String(l.tooth) : undefined,
        inNetwork: Boolean(l.inNetwork),
        date: hh.today,
      }));
      const result = estimateVisit(hh.plan, member, lines, hh.catalog);
      ctx.cards.push({
        type: 'estimate',
        data: {
          memberId,
          firstName: member.firstName,
          lines: result.lines,
          total: result.total,
        },
      });
      return result;
    }

    case 'optimizeYear': {
      const memberIds = Array.isArray(input.memberIds)
        ? (input.memberIds as unknown[]).map(String)
        : undefined;
      const members = memberIds
        ? hh.members.filter((m) => memberIds.includes(m.memberId))
        : hh.members;
      const items = memberIds
        ? hh.items.filter((it) => memberIds.includes(it.memberId))
        : hh.items;
      const result = optimizeYear({
        plan: hh.plan,
        members,
        items,
        today: hh.today,
        monthlyBudget: hh.household.monthlyBudget,
        catalog: hh.catalog,
      });
      return result;
    }

    case 'scheduleVisit': {
      const memberId = String(input.memberId ?? '');
      const treatmentItemId = String(input.treatmentItemId ?? '');
      const date = String(input.date ?? '');
      if (!memberId || !treatmentItemId || !date) {
        return { error: 'scheduleVisit requires memberId, treatmentItemId, and date (YYYY-MM-DD).' };
      }
      const visit = await repo.scheduleVisit({ memberId, treatmentItemId, date });
      ctx.cards.push({ type: 'schedule', data: visit });
      return visit;
    }

    default:
      return { error: `Unknown tool ${name}` };
  }
}
