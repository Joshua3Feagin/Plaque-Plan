import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { agent } from './functions/agent/resource';

/**
 * Plaque & Plan backend (Amplify Gen 2): Cognito auth + Data (AppSync/DynamoDB) + the
 * Bedrock scheduling agent Lambda (askAgent custom mutation).
 */
const backend = defineBackend({
  auth,
  data,
  agent,
});

// Least-privilege Bedrock access for the agent. The agent uses the US
// cross-region inference profile for Claude, which can route the request to the
// underlying foundation model in us-east-1, us-east-2, or us-west-2 — so we must
// allow invoke on both the inference-profile ARN (in the project region) and the
// foundation-model ARNs in each region it can route to. Anthropic models only.
const region = process.env.BEDROCK_REGION ?? 'us-east-2';
const account = backend.agent.resources.lambda.stack.account;
const routeRegions = ['us-east-1', 'us-east-2', 'us-west-2'];
backend.agent.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    sid: 'AllowBedrockConverse',
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: [
      // Foundation models in each region the inference profile may route to.
      ...routeRegions.map(
        (r) => `arn:aws:bedrock:${r}::foundation-model/anthropic.*`,
      ),
      // The inference profile itself (region-scoped to the project region).
      `arn:aws:bedrock:${region}:${account}:inference-profile/us.anthropic.*`,
    ],
  }),
);
