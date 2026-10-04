// askAgent Lambda entry.
//
// Wires the real Bedrock Converse call and the AppSync data client, derives the
// caller identity from the AppSync event (never from arguments), then runs the
// tool loop. Returns { text, cards } matching the AgentReply custom type.

import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/agent';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

import { runConversation, type ConverseFn, type ConverseRequest } from './converse';
import { AppSyncHouseholdRepo, type DataModels } from './repo';

type Handler = Schema['askAgent']['functionHandler'];

const bedrock = new BedrockRuntimeClient({ region: env.BEDROCK_REGION });

/** Adapt our injectable ConverseFn to the AWS SDK ConverseCommand. */
const converse: ConverseFn = async (req: ConverseRequest) => {
  const input: ConverseCommandInput = {
    modelId: env.BEDROCK_MODEL_ID,
    system: req.system,
    messages: req.messages as ConverseCommandInput['messages'],
    toolConfig: req.toolConfig as unknown as ConverseCommandInput['toolConfig'],
  };
  const out = await bedrock.send(new ConverseCommand(input));
  return {
    output: { message: (out.output?.message ?? { role: 'assistant', content: [] }) as any },
    stopReason: out.stopReason ?? 'end_turn',
  };
};

export const handler: Handler = async (event) => {
  const message = event.arguments.message ?? '';

  // Identity comes from the AppSync event, not from client arguments.
  const identity = event.identity as { sub?: string; username?: string } | undefined;
  const ownerSub = identity?.sub ?? identity?.username ?? 'unknown';

  // Configure the data client with this function's resource config.
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();
  const models = client.models as unknown as DataModels;

  const today = new Date().toISOString().slice(0, 10);
  const repo = new AppSyncHouseholdRepo(models, ownerSub, today);

  try {
    const reply = await runConversation(message, repo, converse);
    return { text: reply.text, cards: reply.cards } as any;
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    return {
      text: `Sorry, I ran into a problem helping with that (${detail}). Please try again in a moment.`,
      cards: [],
    } as any;
  }
};
