import { DEMO_TODAY } from '@maxout/seed';
import { DEMO_BENEFITS, type Benefit } from './seeds';

export type Urgency = 'expired' | 'critical' | 'warning';

export interface ExpiringBenefit extends Benefit {
  daysRemaining: number;
  urgency: Urgency;
}

/**
 * Returns benefits expiring within `withinDays` of `referenceDate`,
 * plus any already expired. Sorted: expired first, then soonest.
 */
export function getExpiringBenefits(
  withinDays = 30,
  referenceDate: string = DEMO_TODAY,
  benefits: Benefit[] = DEMO_BENEFITS,
): ExpiringBenefit[] {
  const ref = new Date(referenceDate);

  return benefits
    .map((b) => {
      const expiry = new Date(b.expiryDate);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((expiry.getTime() - ref.getTime()) / msPerDay);
      const urgency: Urgency =
        daysRemaining < 0 ? 'expired' : daysRemaining <= 7 ? 'critical' : 'warning';
      return { ...b, daysRemaining, urgency };
    })
    .filter((b) => b.daysRemaining <= withinDays)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
