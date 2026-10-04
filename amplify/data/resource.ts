import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { agent } from '../functions/agent/resource';

/**
 * Plaque & Plan data schema (Amplify Gen 2 / AppSync + DynamoDB).
 *
 * Owner-based authorization on household-scoped models (Requirement 1.2); the
 * shared catalog (Plan, Procedure) is readable by any authenticated user.
 * `rules`, `data`, and `estimate` JSON fields mirror the shapes in
 * packages/engine so the engine can price directly from stored records.
 *
 * Note: this is the Task 1 skeleton. Seed data and any refinements land in Task 2.
 */
const schema = a.schema({
  Household: a
    .model({
      name: a.string(),
      monthlyBudget: a.float(),
      planYearStartMonth: a.integer(),
      members: a.hasMany('Member', 'householdId'),
    })
    .authorization((allow) => [allow.owner()]),

  Member: a
    .model({
      householdId: a.id(),
      household: a.belongsTo('Household', 'householdId'),
      firstName: a.string().required(),
      relation: a.enum(['self', 'spouse', 'child']),
      birthYear: a.integer(),
      planId: a.id(),
      enrolledOn: a.date(),
      maxUsed: a.float(),
      deductibleMet: a.float(),
    })
    .authorization((allow) => [allow.owner()]),

  Plan: a
    .model({
      name: a.string(),
      carrier: a.string(),
      rules: a.json(), // engine Plan shape
    })
    .authorization((allow) => [allow.authenticated().to(['read']), allow.owner()]),

  Procedure: a
    .model({
      code: a.string().required(),
      name: a.string(),
      plainName: a.string(),
      tier: a.string(),
      data: a.json(), // engine Procedure shape
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),

  Visit: a
    .model({
      memberId: a.id(),
      treatmentItemId: a.id(),
      date: a.date(),
      status: a.enum(['recommended', 'scheduled']),
      memberOwes: a.float(),
    })
    .authorization((allow) => [allow.owner()]),

  TreatmentItem: a
    .model({
      memberId: a.id(),
      code: a.string(),
      tooth: a.string(),
      urgency: a.string(),
      status: a.enum(['planned', 'scheduled', 'done']),
      plannedMonth: a.string(),
      inNetwork: a.boolean(),
      estimate: a.json(),
    })
    .authorization((allow) => [allow.owner()]),

  Usage: a
    .model({
      memberId: a.id(),
      date: a.date(),
      code: a.string(),
      tooth: a.string(),
      insurerPaid: a.float(),
      memberPaid: a.float(),
    })
    .authorization((allow) => [allow.owner()]),

  // --- AI scheduling agent (Task 6) ---

  /** A single card the app renders under the agent's text answer. */
  AgentCard: a.customType({
    type: a.string().required(), // 'estimate' | 'schedule'
    data: a.json().required(), // card payload (engine result / scheduled visit)
  }),

  /** The agent's reply: plain text plus zero or more cards. */
  AgentReply: a.customType({
    text: a.string().required(),
    cards: a.ref('AgentCard').array(),
  }),

  /**
   * Ask the scheduling agent. The Lambda derives the household from the caller's
   * Cognito identity — the client never passes a householdId. Any signed-in user
   * may call it; owner rules on the data models constrain what the agent reads.
   */
  askAgent: a
    .mutation()
    .arguments({
      conversationId: a.string(),
      message: a.string().required(),
    })
    .returns(a.ref('AgentReply'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(agent)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
