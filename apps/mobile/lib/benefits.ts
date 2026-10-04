// Benefits coverage categories for the Benefits + Account screens.
//
// The mockups show four categories (Preventive, Basic, Major, Orthodontics) with
// a coverage percentage and a "What's included" list. The engine's Tier type only
// models preventive/basic/major for pricing, so Orthodontics is represented here
// as its own display-only category. Percentages mirror the Sample PPO Plus plan
// (100/80/50) with Orthodontics at 50%.

export interface CoverageCategory {
  /** Stable key used for routing to the Category Detail screen. */
  key: 'preventive' | 'basic' | 'major' | 'orthodontics';
  /** Display name, e.g. "Preventive". */
  name: string;
  /** Insurer coverage share, 0..1. */
  coverage: number;
  /** One-line coverage summary shown in the maroon header. */
  summary: string;
  /** "What's included" — procedures covered under this category. */
  included: string[];
}

export const COVERAGE_CATEGORIES: CoverageCategory[] = [
  {
    key: 'preventive',
    name: 'Preventive',
    coverage: 1.0,
    summary: '100% covered — in-network and out-of-network',
    included: [
      'Routine Oral Exams',
      'Bitewing X-rays',
      'Full-mouth or Panoramic X-rays',
      'Routine Cleanings',
      'Fluoride Treatments',
      'Space Maintainers for Children',
      'Sealants',
      'Problem Focused Exams',
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    coverage: 0.8,
    summary: '80% covered after your deductible',
    included: [
      'Amalgam (Silver) Fillings',
      'Composite (Tooth-colored) Fillings',
      'Simple Tooth Extractions',
      'Periodontal Scaling & Root Planing (Deep Cleaning)',
      'Emergency Pain Treatment',
    ],
  },
  {
    key: 'major',
    name: 'Major',
    coverage: 0.5,
    summary: '50% covered after your deductible',
    included: [
      'Crowns (Porcelain / Ceramic)',
      'Core Buildups',
      'Root Canals (Endodontic Therapy)',
      'Bridges',
      'Dentures (Full & Partial)',
      'Surgical Tooth Extractions',
    ],
  },
  {
    key: 'orthodontics',
    name: 'Orthodontics',
    coverage: 0.5,
    summary: '50% covered up to the lifetime maximum',
    included: [
      'Comprehensive Orthodontic Treatment',
      'Braces (Fixed Appliances)',
      'Clear Aligners',
      'Orthodontic Records & X-rays',
      'Retainers',
    ],
  },
];

export const CATEGORY_BY_KEY: Record<string, CoverageCategory> = Object.fromEntries(
  COVERAGE_CATEGORIES.map((c) => [c.key, c]),
);

/** Suggestion chips shown under the Lincoln Larry input on the Benefits screen. */
export const LARRY_SUGGESTIONS = [
  "What's my deductible?",
  'Is a crown covered?',
  'How much is a cleaning?',
  'When does my plan reset?',
];
