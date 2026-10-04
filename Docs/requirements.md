# Requirements Document

## Introduction

MaxOut (working name) is a phone app (Expo / React Native, iOS and Android) that helps an employee and their family get the most out of their dental insurance. It prices dental procedures before the visit using the plan's rules and CDT codes, tracks each member's annual maximum, and schedules care across the plan year so the maximum is fully used and the family's monthly budget is respected. An AI care agent on Amazon Bedrock answers "when should we go and what will it cost?" by calling a deterministic cost engine; the AI never computes money itself.

Built for codeLinc 11 (Lincoln Financial + AWS), Path 1 Dental Benefits Optimizer. **This is a 24-hour build for a team of 3: build only what is listed here. Anything under "Out of scope" is not built.** Demo date in seed data is fixed at November 10.

## Glossary

- **Annual maximum:** most the insurer pays per member per plan year (e.g. $1,500). Resets at plan year start.
- **Deductible:** amount the member pays first (per person), waived for preventive care.
- **Coinsurance tier:** share the insurer pays: Preventive 100%, Basic 80%, Major 50%.
- **CDT code:** ADA dental procedure code, e.g. D1110 adult cleaning, D2740 crown.
- **Cost engine:** the deterministic TypeScript module that does all money math.

## Requirements

### Requirement 1: Sign-in

**User Story:** As an employee, I want to sign in securely, so that my family's information stays private.

#### Acceptance Criteria

1. WHEN a user opens the app without a session THEN the system SHALL show the Amplify Authenticator (Amazon Cognito).
2. WHEN a user signs in THEN the system SHALL load only the household owned by that user (owner authorization rules).
3. The system SHALL provide one seeded demo account with the Rivera household preloaded.

### Requirement 2: Plan and family data

**User Story:** As a parent, I want my plan and my family on one profile, so that every estimate uses our real coverage.

#### Acceptance Criteria

1. The system SHALL ship two seeded plans with: annual maximum, deductible, coinsurance per tier (in and out of network), frequency limits (cleanings 2 per year, crown 1 per tooth per 5 years).
2. The household SHALL have members (first name, relation self/spouse/child, birth year, plan) and a monthly out-of-pocket budget.
3. The system SHALL track per member: annual maximum used, deductible met, visit history.
4. WHEN the user adds a family member THEN the system SHALL require first name, relation, birth year and plan.

### Requirement 3: Visit cost estimate

**User Story:** As an employee, I want to know what a visit will cost before I go, so that I have no surprise bills.

#### Acceptance Criteria

1. WHEN the user searches by plain words or CDT code THEN the system SHALL match procedures from a catalog of about 15 common codes.
2. WHEN a visit has procedures THEN the cost engine SHALL compute per line, in order: allowed amount, deductible applied, insurer pays = min((allowed − deductible) × coinsurance, remaining max), member owes = billed − insurer pays.
3. IF a frequency limit is already used THEN insurer pays SHALL be $0 with a plain-language warning.
4. WHEN the user toggles in network / out of network THEN the system SHALL recompute; out of network adds billed minus allowed to the member's share.
5. Each line SHALL show one plain sentence of why (templated, not AI) and the total SHALL be labeled an estimate.

### Requirement 4: Insurance maximizer (hero)

**User Story:** As an employee, I want the app to schedule my family's care across the year, so that we pay the least and don't waste our annual maximum.

#### Acceptance Criteria

1. Each pending procedure SHALL have urgency: urgent or flexible.
2. WHEN pending items change THEN the optimizer SHALL assign each to a month in this or next plan year, urgent items in the current month.
3. The optimizer SHALL minimize total member out-of-pocket across both years, break ties by leaving the most of next year's maximum, and keep each month at or under the monthly budget except urgent care.
4. The system SHALL show savings vs "book everything now" and one reason per moved item.
5. The system SHALL show, per member and for the household, how much benefit will expire at plan year end if nothing else is booked.
6. GIVEN $900 of max remaining, deductible met, two $1,200 flexible crowns, 50% major, $50 deductible, $1,500 max THEN the optimizer SHALL place one crown this year and one next year: member owes $1,225, savings $275, next year's max left $925.

### Requirement 5: Navigation and Profile tab (hero UI)

**User Story:** As a parent, I want one household profile with everyone listed under it, so that I can see the family at a glance and open any person.

#### Acceptance Criteria

1. The app SHALL have a bottom tab bar with two tabs: Profile and Calendar.
2. The Profile tab SHALL show the household at the top (name, plan, monthly budget, "$X of benefits expire in N days" banner, savings from the recommended schedule) and, under it, a list of members (e.g. Mom, Dad, kids), each row with avatar initial, name, relation, a small gauge and "left to use".
3. WHEN the user taps a member THEN the system SHALL open that member's profile: gauge (left to use, deductible, cleanings left), next visit, care plan (pending items with urgency) with an add-item button, and visit history.
4. Each member profile SHALL have a primary "Estimate a visit" button opening the estimate sheet for that member.
5. The household screen SHALL have an "Add family member" button (first name, relation, birth year, plan).

### Requirement 6: Calendar with AI scheduling (hero)

**User Story:** As a parent, I want a calendar that recommends when each of us should go and lets me ask it to schedule, so that I don't have to plan around insurance myself.

#### Acceptance Criteria

1. The Calendar tab SHALL show a month view with recommended and scheduled visits for every member (member color + initial), and a list for the selected day showing who, what, and what they'll owe.
2. Recommended visits SHALL come from the optimizer (Requirement 4) and SHALL be visually distinct from scheduled ones; the user SHALL be able to accept a recommendation, which makes it scheduled.
3. The Calendar tab SHALL have an "Ask" box. WHEN the user sends a message (e.g. "schedule the kids' cleanings before the year ends, we have $150 a month") THEN a Lambda SHALL call Amazon Bedrock (Claude) with the Converse API and tools: getHousehold, estimateVisit, optimizeYear, scheduleVisit.
4. WHEN the agent calls scheduleVisit THEN the system SHALL add or move the visit on the calendar and show it immediately.
5. The agent SHALL take every dollar amount from a tool result and SHALL NOT compute money itself; it SHALL decline diagnosis or medical advice and SHALL NOT delay urgent care.
6. Agent answers SHALL render as text plus simple cards (estimate or schedule); IF Bedrock fails THEN the app SHALL show a friendly error and stay usable.

### Requirement 7: Look, feel and usability

**User Story:** As any user, I want a clear app in Lincoln Financial's colors, so that it is easy to use and feels trustworthy.

#### Acceptance Criteria

1. The app SHALL use the Lincoln Financial theme from the brand steering file (primary #650030).
2. Any member's estimate SHALL be at most two taps from the Profile tab.
3. Every screen SHALL have a loading state and an empty state that says what to do next.
4. Copy SHALL use plain words (e.g. "left to use this year"); tap targets at least 44pt; text meets WCAG AA contrast.

## Out of scope (do not build unless everything above is done and demo-ready)

- Camera / photo capture of treatment plans (Textract) and plan PDF import
- Phone notifications / reminders, and syncing to the phone's own calendar
- Family deductible, waiting periods, age limits, orthodontic lifetime max
- First-run setup wizard (demo family is seeded; "Add family member" covers adding people)
- Bedrock Guardrails, voice input, Spanish, FSA/HSA, employer/HR view
