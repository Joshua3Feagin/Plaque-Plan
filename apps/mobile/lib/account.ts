// Account-screen helpers: the member ID card and plan-usage figures.
//
// ID numbers are demo values derived deterministically from the member id so they
// are stable across renders without needing to be stored. All dollar figures are
// read from the engine-backed household state by the screen, not computed here.

import type { Member } from './useHousehold';

export interface IdCard {
  planName: string;
  memberName: string;
  relationLabel: string;
  memberId: string;
  groupNumber: string;
}

/** Map a relation to the label shown on the Account/ID card ("self" -> Policyholder). */
export function accountRelationLabel(relation: Member['relation']): string {
  switch (relation) {
    case 'self':
      return 'Policyholder';
    case 'spouse':
      return 'Spouse';
    case 'child':
      return 'Dependent';
  }
}

/** Deterministic 6-digit-ish suffix from a string id. */
function stableDigits(id: string, len: number): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % Math.pow(10, len)).toString().padStart(len, '0');
}

/** Build a stable demo ID card for a member. */
export function idCardFor(
  member: Member,
  planName: string,
  lastName: string,
  groupNumber: string,
): IdCard {
  const suffix = stableDigits(member.id, 7); // e.g. 4421007
  const memberId = `DM-${suffix.slice(0, 5)}-${suffix.slice(5)}`;
  return {
    planName,
    memberName: `${member.firstName} ${lastName}`.trim(),
    relationLabel: accountRelationLabel(member.relation),
    memberId,
    groupNumber,
  };
}
