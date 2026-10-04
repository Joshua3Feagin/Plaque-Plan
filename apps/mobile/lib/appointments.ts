// Appointment display helpers for the Calendar screen.
//
// The optimizer-derived visits carry memberId / code / date / amount. The mockup's
// "Upcoming appointments" cards also show a procedure title, a time, and a
// provider with address. Those presentation details are demo data generated
// deterministically from the visit so they stay stable across renders.

import type { Procedure } from '@maxout/engine';
import type { Visit, Member } from './useHousehold';

export interface AppointmentView {
  id: string;
  memberId: string;
  memberName: string;
  title: string; // procedure plain name, e.g. "Routine Cleaning"
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  provider: string;
  address: string;
  status: Visit['status'];
}

const PROVIDERS = [
  { provider: 'Dr. Patel Family Dental', address: '120 Main St, Notre Dame, IN' },
  { provider: 'Bright Smiles Orthodontics', address: '48 Elm St, South Bend, IN' },
  { provider: 'Lincoln Park Dental Group', address: '300 Oak Ave, South Bend, IN' },
  { provider: 'Riverside Dental Care', address: '77 River Rd, Mishawaka, IN' },
];

const TIMES = ['9:15 AM', '10:00 AM', '11:30 AM', '1:45 PM', '2:30 PM', '3:00 PM'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Build the display view for one visit. */
export function appointmentFor(
  visit: Visit,
  member: Member | undefined,
  catalog: Map<string, Procedure>,
): AppointmentView {
  const h = hash(visit.id);
  const proc = catalog.get(visit.code);
  // Orthodontic-ish codes route to the ortho provider; otherwise rotate.
  const providerIdx = h % PROVIDERS.length;
  return {
    id: visit.id,
    memberId: visit.memberId,
    memberName: member?.firstName ?? 'Member',
    title: proc?.plainName ?? visit.code,
    date: visit.date,
    time: TIMES[h % TIMES.length],
    provider: PROVIDERS[providerIdx].provider,
    address: PROVIDERS[providerIdx].address,
    status: visit.status,
  };
}

/** Pretty date for an appointment pill, e.g. "Oct 6". */
export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
