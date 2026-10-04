// Thin wrapper around the askKb mutation (dental coverage Q&A over the Bedrock
// Knowledge Base). Returns a typed reply or throws a friendly error. When the
// backend isn't configured (local demo before deploy), isKbAvailable() is false
// and the UI shows an explanatory state instead of crashing.

import { generateClient } from 'aws-amplify/data';
import { isAmplifyConfigured } from './amplify';

export interface KbSource {
  text: string;
  uri?: string;
  score?: number;
}

export interface KbReply {
  answer: string;
  sources: KbSource[];
  /** 'generated' | 'retrieval-only' | 'error' | 'empty' */
  mode: string;
}

export function isKbAvailable(): boolean {
  return isAmplifyConfigured();
}

/** Short, friendly filename from an s3://bucket/key uri. */
export function sourceName(uri?: string): string | undefined {
  if (!uri) return undefined;
  const parts = uri.split('/');
  return decodeURIComponent(parts[parts.length - 1] || uri);
}

export async function askKb(question: string): Promise<KbReply> {
  if (!isAmplifyConfigured()) {
    throw new Error('BACKEND_NOT_CONFIGURED');
  }

  const client = generateClient<any>();
  const res: any = await client.mutations.askKb({ question });

  if (res.errors && res.errors.length > 0) {
    throw new Error(res.errors.map((e: any) => e.message).join('; '));
  }
  const reply = res.data as KbReply | null;
  if (!reply) throw new Error('The assistant did not return a reply.');

  return {
    answer: reply.answer,
    sources: Array.isArray(reply.sources) ? reply.sources.filter(Boolean) : [],
    mode: reply.mode ?? 'generated',
  };
}
