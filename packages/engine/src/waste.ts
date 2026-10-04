import { Plan, MemberState, ProjectedWasteResult } from './types.js';

/**
 * Calculates how much insurance benefit will be wasted if no additional care is scheduled
 * before the plan year ends
 */
export function projectedWaste(
  plan: Plan,
  members: MemberState[],
  today: string
): ProjectedWasteResult {
  const todayDate = new Date(today);
  const currentYear = todayDate.getFullYear();
  
  // Calculate plan year end date
  const planYearEndMonth = plan.planYearStartMonth === 1 ? 12 : plan.planYearStartMonth - 1;
  const planYearEndYear = plan.planYearStartMonth === 1 ? currentYear : currentYear + 1;
  const planYearEnd = new Date(planYearEndYear, planYearEndMonth, 0); // Last day of the month
  
  // Calculate days left in plan year
  const daysLeft = Math.max(0, Math.ceil((planYearEnd.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const perMember: Record<string, number> = {};
  let total = 0;
  
  for (const member of members) {
    // Calculate remaining annual maximum
    const remainingMax = Math.max(0, plan.annualMax - member.maxUsed);
    
    perMember[member.memberId] = Math.round(remainingMax * 100) / 100;
    total += remainingMax;
  }
  
  return {
    perMember,
    total: Math.round(total * 100) / 100,
    daysLeft
  };
}