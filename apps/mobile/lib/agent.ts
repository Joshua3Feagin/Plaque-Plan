// Thin wrapper around the askAgent mutation. Returns a typed reply or throws a
// friendly error. When the backend isn't configured (local demo before deploy),
// isAgentAvailable() is false and the UI shows an explanatory state instead of
// crashing.

import { generateClient } from 'aws-amplify/data';
import { isAmplifyConfigured } from './amplify';

export interface AgentCard {
  type: 'estimate' | 'schedule';
  data: any;
}

export interface AgentReply {
  text: string;
  cards: AgentCard[];
}

export function isAgentAvailable(): boolean {
  return isAmplifyConfigured();
}

export async function askAgent(message: string, conversationId?: string): Promise<AgentReply> {
  if (!isAmplifyConfigured()) {
    throw new Error('BACKEND_NOT_CONFIGURED');
  }

  // Loosely typed: the generated Schema type isn't imported into the app.
  const client = generateClient<any>();
  const res: any = await client.mutations.askAgent({ message, conversationId });

  if (res.errors && res.errors.length > 0) {
    throw new Error(res.errors.map((e: any) => e.message).join('; '));
  }
  const reply = res.data as AgentReply | null;
  if (!reply) throw new Error('The assistant did not return a reply.');

  return {
    text: reply.text,
    cards: Array.isArray(reply.cards) ? reply.cards.filter(Boolean) : [],
  };
}
