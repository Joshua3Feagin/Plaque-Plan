// Benefit reminder seed data — edit this file to change the demo scenario.
// Dates are relative to DEMO_TODAY ('2025-11-10') so the demo is always consistent.

export interface Benefit {
  id: string;
  name: string;
  description: string;
  expiryDate: string; // YYYY-MM-DD
}

export interface DemoUser {
  firstName: string;
  email: string;
}

/** The signed-in demo user. Email is used as the reminder recipient. */
export const DEMO_USER: DemoUser = {
  firstName: 'Sam',
  email: 'sam.rivera@example.com',
};

/** Sample benefits — one critical (3 days), one warning (14 days), one expired. */
export const DEMO_BENEFITS: Benefit[] = [
  {
    id: 'flex-spend',
    name: 'Flexible Spending Account',
    description: 'Use your remaining FSA balance before it expires.',
    expiryDate: '2025-11-13', // 3 days after DEMO_TODAY
  },
  {
    id: 'dental-max',
    name: 'Dental Annual Maximum',
    description: '$900 of your $2,000 annual maximum is still unused.',
    expiryDate: '2025-11-24', // 14 days after DEMO_TODAY
  },
  {
    id: 'vision',
    name: 'Vision Benefit',
    description: 'Annual eye exam and frames allowance.',
    expiryDate: '2025-11-05', // 5 days BEFORE DEMO_TODAY — already expired
  },
];
