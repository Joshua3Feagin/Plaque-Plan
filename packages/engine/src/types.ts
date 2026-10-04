// Core types for the MaxOut dental benefits optimizer engine

export type Tier = 'preventive' | 'basic' | 'major';
export type Urgency = 'urgent' | 'flexible';

export interface Plan {
  id: string;
  name: string;
  planYearStartMonth: number; // 1 = Jan
  annualMax: number;
  deductible: number;
  deductibleWaivedFor: Tier[];             // usually ['preventive']
  coinsIn: Record<Tier, number>;          // 1.0, 0.8, 0.5
  coinsOut: Record<Tier, number>;         // out-of-network coinsurance
}

export interface Procedure {
  code: string;
  name: string;
  plainName: string;
  tier: Tier;
  feeIn: number;        // in-network fee
  feeOut: number;       // out-of-network fee
  ucr: number;          // usual, customary, reasonable
  frequency?: { 
    count: number; 
    perMonths: number; 
    perTooth?: boolean 
  };
  requiresBefore?: string[];               // e.g. D2740 after D3330 on same tooth
}

export interface MemberState {
  memberId: string;
  birthYear: number;
  enrolledOn: string;   // ISO date string
  maxUsed: number;
  deductibleMet: number;
  history: { 
    code: string; 
    date: string;       // ISO date string
    tooth?: string 
  }[];
}

export interface LineInput { 
  code: string; 
  tooth?: string; 
  inNetwork: boolean; 
  date: string;         // ISO date string
}

export interface LineResult {
  code: string;
  billed: number;
  allowed: number;
  deductibleApplied: number;
  insurerPays: number;
  memberOwes: number;
  warnings: string[];
  explanation: string;
}

export interface EstimateVisitResult {
  lines: LineResult[];
  total: { 
    insurer: number; 
    member: number 
  };
  after: MemberState;
}

export interface PendingItem { 
  id: string; 
  memberId: string; 
  code: string; 
  tooth?: string; 
  urgency: Urgency; 
  inNetwork: boolean;
}

export interface ScheduleResult {
  placements: { 
    itemId: string; 
    month: string;      // YYYY-MM format
    memberOwes: number; 
    reason: string 
  }[];
  byMonth: { 
    month: string; 
    memberOwes: number; 
    overBudget: boolean 
  }[];
  totalOwed: number;
  baselineOwed: number;
  savings: number;
  nextYearMaxLeft: Record<string, number>;  // memberId -> remaining max
}

export interface OptimizeYearInput {
  plan: Plan;
  members: MemberState[];
  items: PendingItem[];
  today: string;        // ISO date string
  monthlyBudget: number;
  catalog: Map<string, Procedure>;
}

export interface ProjectedWasteResult {
  perMember: Record<string, number>;  // memberId -> wasted amount
  total: number;
  daysLeft: number;
}