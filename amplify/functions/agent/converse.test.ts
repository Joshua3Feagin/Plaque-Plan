import { describe, it, expect, vi } from 'vitest';
import type { Plan, Procedure, MemberState, PendingItem } from '@maxout/engine';

import { runConversation, MAX_TOOL_TURNS, type ConverseFn, type ConverseResponse } from './converse';
import type { HouseholdRepo, HouseholdData, ScheduledVisit } from './tools';

// --- Fixtures (a small self-contained household) ---------------------------

const plan: Plan = {
  id: 'p',
  name: 'Sample PPO Plus',
  planYearStartMonth: 1,
  annualMax: 1500,
  deductible: 50,
  deductibleWaivedFor: ['preventive'],
  coinsIn: { preventive: 1.0, basic: 0.8, major: 0.5 },
  coinsOut: { preventive: 1.0, basic: 0.7, major: 0.4 },
};

const catalog = new Map<string, Procedure>([
  ['D1120', { code: 'D1120', name: 'Prophylaxis - child', plainName: 'Cleaning (child)', tier: 'preventive', feeIn: 80, feeOut: 100, ucr: 90, frequency: { count: 2, perMonths: 12 } }],
  ['D2740', { code: 'D2740', name: 'Crown', plainName: 'Crown', tier: 'major', feeIn: 1200, feeOut: 1400, ucr: 1300, frequency: { count: 1, perMonths: 60, perTooth: true } }],
]);

const members: HouseholdData['members'] = [
  { memberId: 'maya', firstName: 'Maya', relation: 'child', birthYear: 2014, enrolledOn: '2025-01-01', maxUsed: 0, deductibleMet: 0, history: [] },
];

const items: PendingItem[] = [
  { id: 'maya-cleaning', memberId: 'maya', code: 'D1120', urgency: 'flexible', inNetwork: true },
];

/** In-memory repo recording scheduled visits. */
class FakeRepo implements HouseholdRepo {
  public scheduled: ScheduledVisit[] = [];
  async load(): Promise<HouseholdData> {
    return {
      household: { id: 'h', name: 'Rivera', monthlyBudget: 150, planYearStartMonth: 1 },
      plan,
      catalog,
      members,
      items,
      today: '2025-11-10',
    };
  }
  async scheduleVisit(input: { memberId: string; treatmentItemId: string; date: string }): Promise<ScheduledVisit> {
    const v: ScheduledVisit = { id: `v-${input.treatmentItemId}`, status: 'scheduled', memberOwes: 0, ...input };
    this.scheduled.push(v);
    return v;
  }
}

// --- Helpers to script the mocked Converse responses -----------------------

function toolUse(name: string, input: Record<string, unknown>): ConverseResponse {
  return {
    stopReason: 'tool_use',
    output: { message: { role: 'assistant', content: [{ toolUse: { toolUseId: `t-${name}`, name, input } }] } },
  };
}
function finalText(text: string): ConverseResponse {
  return { stopReason: 'end_turn', output: { message: { role: 'assistant', content: [{ text }] } } };
}

// --- Tests ------------------------------------------------------------------

describe('agent Converse loop', () => {
  it('dispatches tools, schedules a visit, and shapes the reply with a card', async () => {
    const repo = new FakeRepo();

    // Script: getHousehold -> scheduleVisit -> final answer.
    const script: ConverseResponse[] = [
      toolUse('getHousehold', {}),
      toolUse('scheduleVisit', { memberId: 'maya', treatmentItemId: 'maya-cleaning', date: '2025-12-05' }),
      finalText('Booked Maya’s cleaning for December. Next step: add it to your calendar reminders.'),
    ];
    let call = 0;
    const converse: ConverseFn = vi.fn(async () => script[call++]);

    const reply = await runConversation("Schedule Maya's cleaning", repo, converse);

    // The model was called once per turn (3 turns here).
    expect(converse).toHaveBeenCalledTimes(3);

    // scheduleVisit tool actually ran against the repo.
    expect(repo.scheduled).toHaveLength(1);
    expect(repo.scheduled[0]).toMatchObject({ memberId: 'maya', treatmentItemId: 'maya-cleaning', date: '2025-12-05' });

    // Reply shape: text + a schedule card from the tool.
    expect(reply.text).toContain('Booked Maya');
    expect(reply.cards).toHaveLength(1);
    expect(reply.cards[0].type).toBe('schedule');
    expect((reply.cards[0].data as any).date).toBe('2025-12-05');
  });

  it('feeds tool results back to the model (getHousehold result reaches the next request)', async () => {
    const repo = new FakeRepo();
    const seen: any[] = [];
    const converse: ConverseFn = vi.fn(async (req) => {
      seen.push(req.messages);
      if (req.messages.length === 1) return toolUse('getHousehold', {});
      return finalText('Maya has one cleaning left. Next step: pick a date that fits your budget.');
    });

    const reply = await runConversation('What does Maya still need?', repo, converse);

    // Second request must include the tool result message with the household JSON.
    const secondReqMessages = seen[1];
    const toolResultMsg = secondReqMessages.find((m: any) =>
      m.content.some((c: any) => c.toolResult),
    );
    expect(toolResultMsg).toBeTruthy();
    const payload = toolResultMsg.content[0].toolResult.content[0].json;
    expect(payload.members[0].firstName).toBe('Maya');
    expect(reply.text).toContain('Maya');
  });

  it('produces an estimate card with engine numbers when estimateVisit is used', async () => {
    const repo = new FakeRepo();
    const script: ConverseResponse[] = [
      toolUse('estimateVisit', { memberId: 'maya', lines: [{ code: 'D2740', inNetwork: true }] }),
      finalText('A crown would cost about that much. Next step: ask your dentist if a crown is needed.'),
    ];
    let call = 0;
    const converse: ConverseFn = vi.fn(async () => script[call++]);

    const reply = await runConversation('What would a crown cost for Maya?', repo, converse);

    expect(reply.cards).toHaveLength(1);
    expect(reply.cards[0].type).toBe('estimate');
    // Crown: major 50%, deductible $50 -> insurer (1200-50)*0.5 = 575, owes 625.
    expect((reply.cards[0].data as any).total.member).toBe(625);
  });

  it('stops at the tool-turn cap even if the model keeps requesting tools', async () => {
    const repo = new FakeRepo();
    // Always ask for a tool — the loop must still terminate.
    const converse: ConverseFn = vi.fn(async () => toolUse('getHousehold', {}));

    const reply = await runConversation('loop forever', repo, converse);

    expect(converse).toHaveBeenCalledTimes(MAX_TOOL_TURNS);
    // No final text was ever produced -> graceful fallback message.
    expect(reply.text.length).toBeGreaterThan(0);
  });

  it('returns a tool error to the model without throwing', async () => {
    const repo = new FakeRepo();
    const script: ConverseResponse[] = [
      toolUse('scheduleVisit', { memberId: 'maya' }), // missing fields -> tool returns {error}
      finalText('I need a date to book that. Next step: tell me which day works.'),
    ];
    let call = 0;
    const converse: ConverseFn = vi.fn(async () => script[call++]);

    const reply = await runConversation('book it', repo, converse);
    expect(repo.scheduled).toHaveLength(0);
    expect(reply.text).toContain('date');
  });
});
