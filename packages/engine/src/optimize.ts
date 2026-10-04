import { 
  OptimizeYearInput, 
  ScheduleResult, 
  PendingItem, 
  MemberState, 
  Plan,
  Urgency 
} from './types.js';
import { estimateVisit } from './estimate.js';

/**
 * Optimizes scheduling of pending items across plan years
 * Algorithm:
 * 1. Pin urgent items to the current month
 * 2. For flexible items (n ≤ 10), enumerate assignments to {this year, next year} (2^n)
 * 3. For each assignment, order items by tier, assign each to the earliest month 
 *    whose running member cost stays ≤ monthlyBudget (spill to next month; urgent ignores budget)
 * 4. Score = total memberOwes across both years; tie-break by higher sum of next-year max left
 * 5. Baseline = all items in the current month. savings = baseline − best
 */
export function optimizeYear(input: OptimizeYearInput): ScheduleResult {
  const { plan, members, items, today, monthlyBudget, catalog } = input;
  
  const currentDate = new Date(today);
  const currentMonth = formatMonth(currentDate);
  
  // Separate urgent and flexible items
  const urgentItems = items.filter(item => item.urgency === 'urgent');
  const flexibleItems = items.filter(item => item.urgency === 'flexible');
  
  // Calculate baseline: all items in current month
  const baseline = calculateScenarioScore(
    plan, 
    members, 
    items, 
    items.map(item => ({ itemId: item.id, year: 'current' })),
    currentMonth,
    monthlyBudget,
    catalog
  );
  
  let bestScenario = baseline;
  let bestAssignment = items.map(item => ({ itemId: item.id, year: 'current' as 'current' | 'next' }));
  
  // If we have 10 or fewer flexible items, enumerate all combinations
  if (flexibleItems.length <= 10) {
    const assignments = generateAssignments(flexibleItems);
    
    for (const assignment of assignments) {
      // Combine urgent (always current year) with this flexible assignment
      const fullAssignment = [
        ...urgentItems.map(item => ({ itemId: item.id, year: 'current' as const })),
        ...assignment
      ];
      
      const scenario = calculateScenarioScore(
        plan, 
        members, 
        items, 
        fullAssignment,
        currentMonth,
        monthlyBudget,
        catalog
      );
      
      if (isScenarioBetter(scenario, bestScenario)) {
        bestScenario = scenario;
        bestAssignment = fullAssignment;
      }
    }
  } else {
    // For more than 10 items, use a greedy approach
    bestAssignment = greedyOptimization(plan, members, items, currentMonth, monthlyBudget, catalog);
    bestScenario = calculateScenarioScore(plan, members, items, bestAssignment, currentMonth, monthlyBudget, catalog);
  }
  
  return {
    placements: bestScenario.placements,
    byMonth: bestScenario.byMonth,
    totalOwed: bestScenario.totalOwed,
    baselineOwed: baseline.totalOwed,
    savings: baseline.totalOwed - bestScenario.totalOwed,
    nextYearMaxLeft: bestScenario.nextYearMaxLeft
  };
}

function generateAssignments(flexibleItems: PendingItem[]): Array<{ itemId: string; year: 'current' | 'next' }[]> {
  const n = flexibleItems.length;
  const assignments: Array<{ itemId: string; year: 'current' | 'next' }[]> = [];
  
  // Generate all 2^n combinations
  for (let i = 0; i < Math.pow(2, n); i++) {
    const assignment: { itemId: string; year: 'current' | 'next' }[] = [];
    
    for (let j = 0; j < n; j++) {
      const year = (i & (1 << j)) ? 'next' : 'current';
      assignment.push({ itemId: flexibleItems[j].id, year });
    }
    
    assignments.push(assignment);
  }
  
  return assignments;
}

interface ScenarioScore {
  totalOwed: number;
  nextYearMaxLeft: Record<string, number>;
  placements: { itemId: string; month: string; memberOwes: number; reason: string }[];
  byMonth: { month: string; memberOwes: number; overBudget: boolean }[];
}

function calculateScenarioScore(
  plan: Plan,
  members: MemberState[],
  items: PendingItem[],
  assignment: { itemId: string; year: 'current' | 'next' }[],
  currentMonth: string,
  monthlyBudget: number,
  catalog: Map<string, any>
): ScenarioScore {
  const placements: { itemId: string; month: string; memberOwes: number; reason: string }[] = [];
  const monthlyTotals: Record<string, number> = {};
  
  // Separate items by year
  const currentYearItems = items.filter(item => 
    assignment.find(a => a.itemId === item.id)?.year === 'current'
  );
  const nextYearItems = items.filter(item => 
    assignment.find(a => a.itemId === item.id)?.year === 'next'
  );
  
  // Process current year items
  // Deep copy so mutations here don't corrupt the original members array across scenario iterations
  const membersAfterCurrentYear = members.map(m => ({ ...m, history: [...m.history] }));
  for (const item of currentYearItems) {
    const member = membersAfterCurrentYear.find(m => m.memberId === item.memberId);
    if (!member) continue;
    
    const targetMonth = item.urgency === 'urgent' ? currentMonth : findBestMonth(
      member, 
      item, 
      plan, 
      catalog, 
      currentMonth, 
      monthlyBudget, 
      monthlyTotals
    );
    
    const estimate = estimateVisit(
      plan,
      member,
      [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: `${targetMonth}-15` }],
      catalog
    );
    
    const memberOwes = estimate.lines[0]?.memberOwes || 0;
    monthlyTotals[targetMonth] = (monthlyTotals[targetMonth] || 0) + memberOwes;
    
    // Update member state
    Object.assign(member, estimate.after);
    
    placements.push({
      itemId: item.id,
      month: targetMonth,
      memberOwes,
      reason: generateReason(item, targetMonth, currentMonth)
    });
  }
  
  // Process next year items (fresh member states)
  const nextYearMembers = members.map(member => ({
    ...member,
    maxUsed: 0,
    deductibleMet: 0
  }));
  
  for (const item of nextYearItems) {
    const member = nextYearMembers.find(m => m.memberId === item.memberId);
    if (!member) continue;
    
    const nextYearMonth = getNextYearMonth(plan, currentMonth);
    
    const estimate = estimateVisit(
      plan,
      member,
      [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: `${nextYearMonth}-15` }],
      catalog
    );
    
    const memberOwes = estimate.lines[0]?.memberOwes || 0;
    
    // Update member state
    Object.assign(member, estimate.after);
    
    placements.push({
      itemId: item.id,
      month: nextYearMonth,
      memberOwes,
      reason: `Moved to next plan year: fresh ${plan.annualMax} maximum available`
    });
  }
  
  const totalOwed = placements.reduce((sum, p) => sum + p.memberOwes, 0);
  const nextYearMaxLeft: Record<string, number> = {};
  
  for (const member of nextYearMembers) {
    nextYearMaxLeft[member.memberId] = plan.annualMax - member.maxUsed;
  }
  
  const byMonth = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    memberOwes: Math.round(amount * 100) / 100,
    overBudget: amount > monthlyBudget
  }));
  
  return {
    totalOwed: Math.round(totalOwed * 100) / 100,
    nextYearMaxLeft,
    placements,
    byMonth
  };
}

function findBestMonth(
  member: MemberState,
  item: PendingItem,
  plan: Plan,
  catalog: Map<string, any>,
  currentMonth: string,
  monthlyBudget: number,
  monthlyTotals: Record<string, number>
): string {
  // For flexible items, find earliest month that fits budget
  const currentDate = new Date(`${currentMonth}-15`);
  
  for (let i = 0; i < 12; i++) {
    const testDate = new Date(currentDate);
    testDate.setMonth(testDate.getMonth() + i);
    const testMonth = formatMonth(testDate);
    
    const estimate = estimateVisit(
      plan,
      member,
      [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: `${testMonth}-15` }],
      catalog
    );
    
    const memberOwes = estimate.lines[0]?.memberOwes || 0;
    const currentMonthTotal = monthlyTotals[testMonth] || 0;
    
    if (currentMonthTotal + memberOwes <= monthlyBudget) {
      return testMonth;
    }
  }
  
  // If no month fits budget, use current month
  return currentMonth;
}

function isScenarioBetter(scenario1: ScenarioScore, scenario2: ScenarioScore): boolean {
  if (scenario1.totalOwed !== scenario2.totalOwed) {
    return scenario1.totalOwed < scenario2.totalOwed;
  }
  
  // Tie-break by next year max left
  const total1 = Object.values(scenario1.nextYearMaxLeft).reduce((sum, val) => sum + val, 0);
  const total2 = Object.values(scenario2.nextYearMaxLeft).reduce((sum, val) => sum + val, 0);
  
  return total1 > total2;
}

function greedyOptimization(
  plan: Plan,
  members: MemberState[],
  items: PendingItem[],
  currentMonth: string,
  monthlyBudget: number,
  catalog: Map<string, any>
): { itemId: string; year: 'current' | 'next' }[] {
  // Simple greedy: assign each flexible item to whichever year gives lower cost
  const assignment: { itemId: string; year: 'current' | 'next' }[] = [];
  
  for (const item of items) {
    if (item.urgency === 'urgent') {
      assignment.push({ itemId: item.id, year: 'current' });
      continue;
    }
    
    const member = members.find(m => m.memberId === item.memberId);
    if (!member) continue;
    
    // Calculate cost in current year
    const currentYearEstimate = estimateVisit(
      plan,
      member,
      [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: `${currentMonth}-15` }],
      catalog
    );
    
    // Calculate cost in next year (fresh state)
    const nextYearMember = { ...member, maxUsed: 0, deductibleMet: 0 };
    const nextYearMonth = getNextYearMonth(plan, currentMonth);
    const nextYearEstimate = estimateVisit(
      plan,
      nextYearMember,
      [{ code: item.code, tooth: item.tooth, inNetwork: item.inNetwork, date: `${nextYearMonth}-15` }],
      catalog
    );
    
    const currentYearCost = currentYearEstimate.lines[0]?.memberOwes || 0;
    const nextYearCost = nextYearEstimate.lines[0]?.memberOwes || 0;
    
    assignment.push({ 
      itemId: item.id, 
      year: nextYearCost < currentYearCost ? 'next' : 'current' 
    });
  }
  
  return assignment;
}

function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

function getNextYearMonth(plan: Plan, currentMonth: string): string {
  const currentDate = new Date(`${currentMonth}-15`);
  const nextYear = currentDate.getFullYear() + 1;
  const startMonth = plan.planYearStartMonth.toString().padStart(2, '0');
  return `${nextYear}-${startMonth}`;
}

function generateReason(item: PendingItem, scheduledMonth: string, currentMonth: string): string {
  if (item.urgency === 'urgent') {
    return 'Urgent care scheduled immediately';
  }
  
  if (scheduledMonth === currentMonth) {
    return 'Scheduled for this month within budget';
  }
  
  return `Moved to ${scheduledMonth}: optimizes insurance benefits and fits monthly budget`;
}