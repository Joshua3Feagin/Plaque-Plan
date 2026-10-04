// Plaque & Plan seed catalog: CDT procedures and plans.
//
// Typed against @maxout/engine so the stored records price correctly with
// estimateVisit/optimizeYear. Fees are illustrative "sample regional averages",
// not a real fee schedule (Requirement 2.1 / design seed notes).

import type { Plan, Procedure, Tier } from '@maxout/engine';

/**
 * ~15 common CDT codes across the three tiers.
 * - preventive: exams, cleanings, x-rays, fluoride, sealants (100% covered, deductible waived)
 * - basic: fillings, extractions, deep cleaning (80% in / 70% out)
 * - major: crowns, root canals, dentures (50% in / 40% out)
 *
 * Frequency limits per Requirement 2.1: cleanings 2 per 12 months;
 * crown 1 per tooth per 60 months.
 */
export const PROCEDURES: Procedure[] = [
  // --- Preventive ---
  {
    code: 'D0120',
    name: 'Periodic oral evaluation',
    plainName: 'Routine checkup',
    tier: 'preventive',
    feeIn: 55,
    feeOut: 70,
    ucr: 65,
    frequency: { count: 2, perMonths: 12 },
  },
  {
    code: 'D0150',
    name: 'Comprehensive oral evaluation',
    plainName: 'New-patient exam',
    tier: 'preventive',
    feeIn: 90,
    feeOut: 110,
    ucr: 100,
    frequency: { count: 1, perMonths: 36 },
  },
  {
    code: 'D0210',
    name: 'Intraoral complete series of radiographs',
    plainName: 'Full set of X-rays',
    tier: 'preventive',
    feeIn: 140,
    feeOut: 175,
    ucr: 160,
    frequency: { count: 1, perMonths: 36 },
  },
  {
    code: 'D0274',
    name: 'Bitewings - four radiographic images',
    plainName: 'Bitewing X-rays',
    tier: 'preventive',
    feeIn: 70,
    feeOut: 90,
    ucr: 80,
    frequency: { count: 1, perMonths: 12 },
  },
  {
    code: 'D1110',
    name: 'Prophylaxis - adult',
    plainName: 'Cleaning (adult)',
    tier: 'preventive',
    feeIn: 110,
    feeOut: 140,
    ucr: 125,
    frequency: { count: 2, perMonths: 12 },
  },
  {
    code: 'D1120',
    name: 'Prophylaxis - child',
    plainName: 'Cleaning (child)',
    tier: 'preventive',
    feeIn: 80,
    feeOut: 100,
    ucr: 90,
    frequency: { count: 2, perMonths: 12 },
  },
  {
    code: 'D1206',
    name: 'Topical application of fluoride varnish',
    plainName: 'Fluoride treatment',
    tier: 'preventive',
    feeIn: 45,
    feeOut: 60,
    ucr: 50,
    frequency: { count: 2, perMonths: 12 },
  },
  {
    code: 'D1351',
    name: 'Sealant - per tooth',
    plainName: 'Sealant',
    // Iredell At-A-Glance lists sealants under Basic services (85% after deductible).
    tier: 'basic',
    feeIn: 60,
    feeOut: 75,
    ucr: 68,
    frequency: { count: 1, perMonths: 60, perTooth: true },
  },

  // --- Basic ---
  {
    code: 'D2140',
    name: 'Amalgam - one surface, primary or permanent',
    plainName: 'Silver filling',
    tier: 'basic',
    feeIn: 160,
    feeOut: 200,
    ucr: 185,
  },
  {
    code: 'D2391',
    name: 'Resin-based composite - one surface, posterior',
    plainName: 'Tooth-colored filling',
    tier: 'basic',
    feeIn: 180,
    feeOut: 220,
    ucr: 200,
  },
  {
    code: 'D2392',
    name: 'Resin-based composite - two surfaces, posterior',
    plainName: 'Tooth-colored filling (two surfaces)',
    tier: 'basic',
    feeIn: 230,
    feeOut: 280,
    ucr: 255,
  },
  {
    code: 'D4341',
    name: 'Periodontal scaling and root planing - four or more teeth, per quadrant',
    plainName: 'Deep cleaning (per quadrant)',
    tier: 'basic',
    feeIn: 280,
    feeOut: 340,
    ucr: 310,
    frequency: { count: 1, perMonths: 24, perTooth: false },
  },
  {
    code: 'D7140',
    name: 'Extraction, erupted tooth or exposed root',
    plainName: 'Simple tooth removal',
    tier: 'basic',
    feeIn: 190,
    feeOut: 240,
    ucr: 215,
  },

  // --- Major ---
  {
    code: 'D2740',
    name: 'Crown - porcelain/ceramic',
    plainName: 'Crown',
    tier: 'major',
    feeIn: 1200,
    feeOut: 1400,
    ucr: 1300,
    frequency: { count: 1, perMonths: 60, perTooth: true },
  },
  {
    code: 'D2950',
    name: 'Core buildup, including any pins when required',
    plainName: 'Crown buildup',
    tier: 'major',
    feeIn: 280,
    feeOut: 340,
    ucr: 310,
  },
  {
    code: 'D3330',
    name: 'Endodontic therapy, molar (excluding final restoration)',
    plainName: 'Root canal (molar)',
    tier: 'major',
    feeIn: 1050,
    feeOut: 1300,
    ucr: 1200,
    frequency: { count: 1, perMonths: 60, perTooth: true },
  },
];

/** Lookup map keyed by CDT code, as estimateVisit/optimizeYear expect. */
export const CATALOG: Map<string, Procedure> = new Map(
  PROCEDURES.map((p) => [p.code, p]),
);

const DEFAULT_WAIVED: Tier[] = ['preventive'];

/**
 * The two real Lincoln DentalConnect(R) PPO plans for Iredell County Government
 * (Group ID 1052922), taken from the Benefits At-A-Glance documents.
 *
 * Coinsurance is the share the INSURER pays per tier. In these real plans the
 * in-network and out-of-network coinsurance percentages are identical (the plan
 * pays the same %); the member's out-of-pocket difference comes from the dentist's
 * billed fee vs. the plan's allowed amount, which the engine models via feeOut/ucr.
 *
 * Per the At-A-Glance: Preventive 100% (no deductible), Basic 85% after
 * deductible, Major 50% after deductible. Deductible $50 individual / $150 family,
 * waived for preventive. Annual maximum is combined across preventive/basic/major.
 */
export const PLANS: Plan[] = [
  {
    id: 'lincoln-dentalconnect-high',
    name: 'Lincoln DentalConnect PPO - High Option',
    planYearStartMonth: 1, // calendar-year plan
    annualMax: 2000,
    deductible: 50,
    deductibleWaivedFor: DEFAULT_WAIVED,
    coinsIn: { preventive: 1.0, basic: 0.85, major: 0.5 },
    coinsOut: { preventive: 1.0, basic: 0.85, major: 0.5 },
  },
  {
    id: 'lincoln-dentalconnect-low',
    name: 'Lincoln DentalConnect PPO - Low Option',
    planYearStartMonth: 1, // calendar-year plan
    annualMax: 1500,
    deductible: 50,
    deductibleWaivedFor: DEFAULT_WAIVED,
    coinsIn: { preventive: 1.0, basic: 0.85, major: 0.5 },
    coinsOut: { preventive: 1.0, basic: 0.85, major: 0.5 },
  },
];

/** Plan lookup by id. */
export const PLAN_BY_ID: Map<string, Plan> = new Map(PLANS.map((p) => [p.id, p]));

/** The plan the Rivera demo household is enrolled in (the High Option). */
export const DEMO_PLAN_ID = 'lincoln-dentalconnect-high';
