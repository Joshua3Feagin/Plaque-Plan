import { defineFunction } from '@aws-amplify/backend';

/**
 * Knowledge-Base dental Q&A function.
 *
 * Answers coverage questions from the dental-plan PDFs in Bedrock Knowledge Base
 * 6J1L92S5MT using RetrieveAndGenerate (RAG) with Claude. If generation is gated
 * (e.g. the Anthropic use-case form isn't approved yet) it falls back to
 * Retrieve-only and returns the top passages so the chat still shows real
 * knowledge-base content.
 *
 * Model/region/KB are provided via env so the deployment can be adjusted without
 * code changes.
 */
export const kbqa = defineFunction({
  name: 'kbqa',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    BEDROCK_REGION: 'us-east-2',
    KNOWLEDGE_BASE_ID: '6J1L92S5MT',
    // Claude Sonnet 4.5 via the US cross-region inference profile (on-demand not
    // supported for this model; the inference profile is required).
    GENERATION_MODEL_ARN:
      'arn:aws:bedrock:us-east-2:067200613191:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  },
});
