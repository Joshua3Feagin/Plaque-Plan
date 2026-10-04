import { describe, it, expect } from 'vitest';
import { 
  estimateVisit, 
  optimizeYear, 
  projectedWaste,
  Plan, 
  Procedure, 
  MemberState, 
  PendingItem 
} from '../src/index.js';

// Test data
const samplePlan: Plan = {
  id: 'sample-ppo',
  name: 'Sample PPO Plus',
  planYearStartMonth: 1, // January
  annualMax: 1500,
  deductible: 50,
  deductibleWaivedFor: ['preventive'],
  coinsIn: {
    preventive: 1.0,   // 100%
    basic: 0.8,        // 80%
    major: 0.5         // 50%
  },
  coinsOut: {
    preventive: 1.0,   // 100%
    basic: 0.7,        // 70%
    major: 0.4         // 40%
  }
};

const sampleProcedures = new Map<string, Procedure>([
  ['D1110', {
    code: 'D1110',
    name: 'Adult prophylaxis',
    plainName: 'Regular cleaning',
    tier: 'preventive',
    feeIn: 120,
    feeOut: 150,
    ucr: 140,
    frequency: { count: 2, perMonths: 12 }
  }],
  ['D0150', {
    code: 'D0150',
    name: 'Comprehensive oral evaluation',
    plainName: 'Dental exam',
    tier: 'preventive',
    feeIn: 80,
    feeOut: 100,
    ucr: 90,
    frequency: { count: 1, perMonths: 12 }
  }],
  ['D2740', {
    code: 'D2740',
    name: 'Crown - porcelain/ceramic substrate',
    plainName: 'Crown',
    tier: 'major',
    feeIn: 1200,
    feeOut: 1400,
    ucr: 1300,
    frequency: { count: 1, perMonths: 60, perTooth: true }
  }],
  ['D2391', {
    code: 'D2391',
    name: 'Resin-based composite - one surface, posterior',
    plainName: 'Filling',
    tier: 'basic',
    feeIn: 180,
    feeOut: 220,
    ucr: 200
  }]
]);

describe('estimateVisit', () => {
  it('should handle preventive care with no deductible', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 0,
      history: []
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'D1110', inNetwork: true, date: '2024-06-15' }],
      sampleProcedures
    );

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].deductibleApplied).toBe(0);
    expect(result.lines[0].insurerPays).toBe(120); // 100% coverage
    expect(result.lines[0].memberOwes).toBe(0);
    expect(result.total.member).toBe(0);
    expect(result.total.insurer).toBe(120);
  });

  it('should apply deductible for non-preventive care', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 0,
      history: []
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'D2391', inNetwork: true, date: '2024-06-15' }],
      sampleProcedures
    );

    expect(result.lines[0].deductibleApplied).toBe(50);
    expect(result.lines[0].insurerPays).toBe(104); // (180 - 50) * 0.8
    expect(result.lines[0].memberOwes).toBe(76); // 180 - 104
  });

  it('should enforce frequency limits', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 0,
      history: [
        { code: 'D1110', date: '2024-03-15' },
        { code: 'D1110', date: '2024-09-15' }
      ]
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'D1110', inNetwork: true, date: '2024-12-15' }],
      sampleProcedures
    );

    expect(result.lines[0].insurerPays).toBe(0);
    expect(result.lines[0].memberOwes).toBe(120);
    expect(result.lines[0].warnings).toContain('Frequency limit exceeded: 2 per 12 months');
  });

  it('should apply annual maximum cap', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 1400, // Close to $1500 limit
      deductibleMet: 50,
      history: []
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'D2740', inNetwork: true, date: '2024-06-15' }],
      sampleProcedures
    );

    // Should be capped at remaining $100 maximum
    expect(result.lines[0].insurerPays).toBe(100);
    expect(result.lines[0].memberOwes).toBe(1100); // 1200 - 100
  });

  it('should handle out-of-network billing', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 50,
      history: []
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'D2391', inNetwork: false, date: '2024-06-15' }],
      sampleProcedures
    );

    // Out-of-network: UCR = 200, billed = 220, coins = 70%
    expect(result.lines[0].allowed).toBe(200);
    expect(result.lines[0].billed).toBe(220);
    expect(result.lines[0].insurerPays).toBe(140); // 200 * 0.7
    expect(result.lines[0].memberOwes).toBe(80); // 220 - 140
  });
});

describe('optimizeYear - Crown Example (Requirement 4.6)', () => {
  it('should optimize two crowns correctly: one this year, one next year', () => {
    // Set up the exact scenario from Requirement 4.6:
    // $900 of max remaining, deductible met, two $1,200 flexible crowns
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 600,  // $1500 - $600 = $900 remaining
      deductibleMet: 50, // Deductible already met
      history: []
    };

    const pendingItems: PendingItem[] = [
      {
        id: 'crown1',
        memberId: 'member1',
        code: 'D2740',
        urgency: 'flexible',
        inNetwork: true
      },
      {
        id: 'crown2', 
        memberId: 'member1',
        code: 'D2740',
        tooth: '3',
        urgency: 'flexible',
        inNetwork: true
      }
    ];

    const result = optimizeYear({
      plan: samplePlan,
      members: [member],
      items: pendingItems,
      today: '2024-11-10',
      monthlyBudget: 500,
      catalog: sampleProcedures
    });

    // Expected results from Requirement 4.6:
    // - Member owes $1,225 total 
    // - Saves $275 vs baseline
    // - Next year's max left: $925

    expect(result.totalOwed).toBe(1225);
    expect(result.savings).toBe(275);
    expect(result.nextYearMaxLeft['member1']).toBe(925);
    
    // Should have one crown this year, one next year
    expect(result.placements).toHaveLength(2);
    
    const thisYearPlacements = result.placements.filter(p => p.month.startsWith('2024'));
    const nextYearPlacements = result.placements.filter(p => p.month.startsWith('2025'));
    
    expect(thisYearPlacements).toHaveLength(1);
    expect(nextYearPlacements).toHaveLength(1);

    // This year: (1200 * 50% = 600) capped at remaining $900 → insurer pays $600, member owes $600
    const thisYearCrown = thisYearPlacements[0];
    expect(thisYearCrown.memberOwes).toBe(600);

    // Next year: insurer pays $575 (fresh $1200 * 50% - $25 deductible), member owes $625  
    const nextYearCrown = nextYearPlacements[0];
    expect(nextYearCrown.memberOwes).toBe(625);
  });
});

describe('projectedWaste', () => {
  it('should calculate expiring benefits correctly', () => {
    const members: MemberState[] = [
      {
        memberId: 'member1',
        birthYear: 1990,
        enrolledOn: '2024-01-01',
        maxUsed: 600,
        deductibleMet: 50,
        history: []
      },
      {
        memberId: 'member2',
        birthYear: 1985,
        enrolledOn: '2024-01-01',
        maxUsed: 200,
        deductibleMet: 0,
        history: []
      }
    ];

    const result = projectedWaste(samplePlan, members, '2024-11-10');

    // Member 1: $1500 - $600 = $900 wasted
    // Member 2: $1500 - $200 = $1300 wasted
    expect(result.perMember['member1']).toBe(900);
    expect(result.perMember['member2']).toBe(1300);
    expect(result.total).toBe(2200);
    expect(result.daysLeft).toBeGreaterThan(0);
  });
});

describe('Edge cases', () => {
  it('should handle unknown procedure codes gracefully', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 0,
      history: []
    };

    const result = estimateVisit(
      samplePlan,
      member,
      [{ code: 'UNKNOWN', inNetwork: true, date: '2024-06-15' }],
      sampleProcedures
    );

    expect(result.lines[0].warnings).toContain('Unknown procedure code: UNKNOWN');
    expect(result.lines[0].memberOwes).toBe(0);
    expect(result.lines[0].insurerPays).toBe(0);
  });

  it('should handle empty procedure list', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 0,
      deductibleMet: 0,
      history: []
    };

    const result = estimateVisit(samplePlan, member, [], sampleProcedures);

    expect(result.lines).toHaveLength(0);
    expect(result.total.member).toBe(0);
    expect(result.total.insurer).toBe(0);
  });

  it('should handle optimization with no pending items', () => {
    const member: MemberState = {
      memberId: 'member1',
      birthYear: 1990,
      enrolledOn: '2024-01-01',
      maxUsed: 600,
      deductibleMet: 50,
      history: []
    };

    const result = optimizeYear({
      plan: samplePlan,
      members: [member],
      items: [],
      today: '2024-11-10',
      monthlyBudget: 500,
      catalog: sampleProcedures
    });

    expect(result.placements).toHaveLength(0);
    expect(result.totalOwed).toBe(0);
    expect(result.savings).toBe(0);
  });
});