import { 
  Plan, 
  Procedure, 
  MemberState, 
  LineInput, 
  LineResult, 
  EstimateVisitResult,
  Tier 
} from './types.js';

/**
 * Estimates the cost of a visit with multiple procedures
 * Algorithm per line, in visit order:
 * 1. Look up procedure; if unknown, warning and skip
 * 2. Frequency check: count in history within perMonths (per tooth if set)
 * 3. allowed = inNetwork ? feeIn : ucr; billed = inNetwork ? feeIn : feeOut
 * 4. deductibleApplied = tier in deductibleWaivedFor ? 0 : min(allowed, deductible - member.deductibleMet)
 * 5. raw = (allowed - deductibleApplied) × coins[tier]
 * 6. Cap: insurerPays = min(raw, annualMax - maxUsed)
 * 7. memberOwes = billed - insurerPays. Update member state; round to cents
 * 8. explanation is a template string from tier, coinsurance, deductible, cap (no LLM)
 */
export function estimateVisit(
  plan: Plan,
  member: MemberState,
  lines: LineInput[],
  catalog: Map<string, Procedure>
): EstimateVisitResult {
  const results: LineResult[] = [];
  let runningMaxUsed = member.maxUsed;
  let runningDeductibleMet = member.deductibleMet;
  
  for (const line of lines) {
    const procedure = catalog.get(line.code);
    
    if (!procedure) {
      results.push({
        code: line.code,
        billed: 0,
        allowed: 0,
        deductibleApplied: 0,
        insurerPays: 0,
        memberOwes: 0,
        warnings: [`Unknown procedure code: ${line.code}`],
        explanation: 'Procedure not found in catalog'
      });
      continue;
    }
    
    const warnings: string[] = [];
    
    // Frequency check
    let frequencyExceeded = false;
    if (procedure.frequency) {
      const { count, perMonths, perTooth } = procedure.frequency;
      const cutoffDate = new Date(line.date);
      cutoffDate.setMonth(cutoffDate.getMonth() - perMonths);
      
      const relevantHistory = member.history.filter(h => {
        if (h.code !== line.code) return false;
        if (perTooth && h.tooth !== line.tooth) return false;
        return new Date(h.date) >= cutoffDate;
      });
      
      if (relevantHistory.length >= count) {
        frequencyExceeded = true;
        warnings.push(`Frequency limit exceeded: ${count} per ${perMonths} months${perTooth ? ' per tooth' : ''}`);
      }
    }
    
    // Calculate allowed and billed amounts
    const allowed = line.inNetwork ? procedure.feeIn : procedure.ucr;
    const billed = line.inNetwork ? procedure.feeIn : procedure.feeOut;
    
    let insurerPays = 0;
    let deductibleApplied = 0;
    
    if (!frequencyExceeded) {
      // Apply deductible if not waived for this tier
      if (!plan.deductibleWaivedFor.includes(procedure.tier)) {
        deductibleApplied = Math.min(allowed, plan.deductible - runningDeductibleMet);
      }
      
      // Calculate coinsurance
      const coinsRate = line.inNetwork ? plan.coinsIn[procedure.tier] : plan.coinsOut[procedure.tier];
      const afterDeductible = allowed - deductibleApplied;
      const rawInsurance = afterDeductible * coinsRate;
      
      // Apply annual maximum cap
      insurerPays = Math.min(rawInsurance, plan.annualMax - runningMaxUsed);
    }
    
    const memberOwes = Math.round((billed - insurerPays) * 100) / 100;
    
    // Update running totals
    runningMaxUsed += insurerPays;
    runningDeductibleMet += deductibleApplied;
    
    // Generate explanation
    const explanation = generateExplanation(
      procedure.tier,
      plan.coinsIn[procedure.tier],
      deductibleApplied > 0,
      insurerPays < (allowed - deductibleApplied) * (line.inNetwork ? plan.coinsIn[procedure.tier] : plan.coinsOut[procedure.tier]),
      line.inNetwork
    );
    
    results.push({
      code: line.code,
      billed: Math.round(billed * 100) / 100,
      allowed: Math.round(allowed * 100) / 100,
      deductibleApplied: Math.round(deductibleApplied * 100) / 100,
      insurerPays: Math.round(insurerPays * 100) / 100,
      memberOwes,
      warnings,
      explanation
    });
  }
  
  const totalInsurer = results.reduce((sum, r) => sum + r.insurerPays, 0);
  const totalMember = results.reduce((sum, r) => sum + r.memberOwes, 0);
  
  return {
    lines: results,
    total: {
      insurer: Math.round(totalInsurer * 100) / 100,
      member: Math.round(totalMember * 100) / 100
    },
    after: {
      ...member,
      maxUsed: Math.round(runningMaxUsed * 100) / 100,
      deductibleMet: Math.round(runningDeductibleMet * 100) / 100
    }
  };
}

function generateExplanation(
  tier: Tier,
  coinsRate: number,
  deductibleApplied: boolean,
  hitMaxCap: boolean,
  inNetwork: boolean
): string {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const coinsPercent = Math.round(coinsRate * 100);
  
  let explanation = `${tierName} care`;
  
  if (deductibleApplied) {
    explanation += ', deductible applies';
  }
  
  explanation += `, insurance pays ${coinsPercent}%`;
  
  if (hitMaxCap) {
    explanation += ', limited by annual maximum';
  }
  
  if (!inNetwork) {
    explanation += ', out-of-network balance billing may apply';
  }
  
  return explanation;
}