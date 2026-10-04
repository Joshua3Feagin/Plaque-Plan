// Pure helpers for deriving calendar visits from optimizer placements and
// applying scheduled overrides. Kept free of React so they can be unit-tested
// and reused by the hook.

import type { ScheduleResult } from '@maxout/engine';

export type VisitStatus = 'recommended' | 'scheduled';

export interface DerivedVisit {
  id: string;
  memberId: string;
  treatmentItemId: string;
  code: string;
  date: string; // YYYY-MM-DD
  status: VisitStatus;
  memberOwes: number;
  reason: string;
}

export interface ItemLite {
  id: string;
  memberId: string;
  code: string;
}

/** Anchor a plan month (YYYY-MM) to a concrete date (the 15th). */
export function monthToDate(month: string): string {
  return `${month}-15`;
}

/**
 * Build the merged visit list from optimizer placements plus any scheduled
 * overrides (keyed by treatmentItemId). An override flips status to 'scheduled'
 * and, if it carries a date, moves the visit there.
 */
export function deriveVisits(
  placements: ScheduleResult['placements'],
  items: ItemLite[],
  scheduledOverrides: Record<string, { date: string | null }>,
): DerivedVisit[] {
  const itemById = new Map(items.map((i) => [i.id, i]));
  return placements.map((p) => {
    const item = itemById.get(p.itemId);
    const override = scheduledOverrides[p.itemId];
    const recommendedDate = monthToDate(p.month);
    return {
      id: `v-${p.itemId}`,
      memberId: item?.memberId ?? '',
      treatmentItemId: p.itemId,
      code: item?.code ?? '',
      date: override?.date ?? recommendedDate,
      status: override ? 'scheduled' : 'recommended',
      memberOwes: p.memberOwes,
      reason: p.reason,
    };
  });
}
