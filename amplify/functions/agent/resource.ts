import { defineFunction } from '@aws-amplify/backend';

/**
 * The AI scheduling agent Lambda. Runs a Bedrock Converse tool loop and returns
 * a shaped reply ({ text, cards }). Model id and region are provided via env so
 * the deployment can pick a Claude model available in the account's region.
 */
export const agent = defineFunction({
  name: 'agent',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    // Claude Haiku 4.5 via the US cross-region inference profile. This account's
    // Anthropic models require an inference profile id (not a raw model id), and
    // this profile is ACTIVE in the project region (us-east-2).
    BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    BEDROCK_REGION: 'us-east-2',
  },
});
