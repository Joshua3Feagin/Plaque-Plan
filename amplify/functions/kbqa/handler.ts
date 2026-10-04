// kbqa Lambda: dental coverage Q&A over Bedrock Knowledge Base 6J1L92S5MT.
//
// Strategy:
//   1. Try RetrieveAndGenerate (RAG): retrieve from the KB + answer with Claude.
//   2. If generation is unavailable (e.g. the Anthropic use-case form isn't
//      approved, throttling, etc.), fall back to Retrieve-only and return the
//      top passages so the chat still shows real knowledge-base content.
//
// Returns { answer, sources, mode }:
//   - mode 'generated'      -> answer is a Claude-written RAG answer.
//   - mode 'retrieval-only' -> answer is a short note; sources carry the real
//                              KB passages the UI should display.

import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/kbqa';
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

type Handler = Schema['askKb']['functionHandler'];

const client = new BedrockAgentRuntimeClient({ region: env.BEDROCK_REGION });

/** A knowledge-base source passage shown under an answer. */
interface KbSource {
  text: string;
  uri?: string;
  score?: number;
}

/** True when generation is unavailable for a reason the retrieval-only fallback
 *  can cover: model-access gating, throttling, or missing invoke/profile perms. */
function isModelGated(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('use case details') ||
    msg.includes("isn't supported") ||
    msg.includes('not been submitted') ||
    msg.includes('resourcenotfound') ||
    msg.includes('not authorized') ||
    msg.includes('accessdenied') ||
    msg.includes('getinferenceprofile') ||
    msg.includes('throttl') ||
    msg.includes('too many requests')
  );
}

function s3Name(uri?: string): string | undefined {
  if (!uri) return undefined;
  const parts = uri.split('/');
  return parts[parts.length - 1] || uri;
}

async function retrieveOnly(question: string): Promise<{ answer: string; sources: KbSource[]; mode: string }> {
  const out = await client.send(
    new RetrieveCommand({
      knowledgeBaseId: env.KNOWLEDGE_BASE_ID,
      retrievalQuery: { text: question },
      retrievalConfiguration: { vectorSearchConfiguration: { numberOfResults: 4 } },
    }),
  );
  const sources: KbSource[] = (out.retrievalResults ?? []).map((r) => ({
    text: r.content?.text ?? '',
    uri: r.location?.s3Location?.uri,
    score: r.score,
  }));
  return {
    answer:
      "Here's what I found in your plan documents. (The AI summary is being enabled — showing the exact passages for now.)",
    sources,
    mode: 'retrieval-only',
  };
}

export const handler: Handler = async (event) => {
  const question = (event.arguments.question ?? '').trim();
  if (!question) {
    return { answer: 'Please ask a question about your dental coverage.', sources: [], mode: 'empty' } as any;
  }

  // 1. Try full RAG (retrieve + Claude generation).
  try {
    const out = await client.send(
      new RetrieveAndGenerateCommand({
        input: { text: question },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: env.KNOWLEDGE_BASE_ID,
            modelArn: env.GENERATION_MODEL_ARN,
          },
        },
      }),
    );

    const answer = out.output?.text ?? '';
    const sources: KbSource[] = [];
    for (const c of out.citations ?? []) {
      for (const ref of c.retrievedReferences ?? []) {
        sources.push({
          text: ref.content?.text ?? '',
          uri: ref.location?.s3Location?.uri,
        });
      }
    }
    return { answer, sources, mode: 'generated' } as any;
  } catch (err) {
    // 2. Generation gated/unavailable -> retrieval-only fallback.
    if (isModelGated(err)) {
      try {
        const fallback = await retrieveOnly(question);
        return fallback as any;
      } catch (err2) {
        const d = err2 instanceof Error ? err2.message : 'unknown';
        return { answer: `I couldn't reach the knowledge base just now (${d}).`, sources: [], mode: 'error' } as any;
      }
    }
    const d = err instanceof Error ? err.message : 'unknown';
    return { answer: `Sorry, I ran into a problem answering that (${d}).`, sources: [], mode: 'error' } as any;
  }
};
