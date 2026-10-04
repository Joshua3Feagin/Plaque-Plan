// Configures AWS Amplify for the app at startup.
//
// After running `npx ampx sandbox` (or a deploy), Amplify writes
// `amplify_outputs.json` to the repo root. We import it dynamically so the app
// still boots (in a clearly degraded state) before the backend exists, which is
// useful during early scaffolding and for engine-only screens.

import { Amplify } from 'aws-amplify';

let configured = false;

export function configureAmplify(): boolean {
  if (configured) return true;
  try {
    // Resolved at bundle time if present; see amplify/ backend.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const outputs = require('../../../amplify_outputs.json');
    Amplify.configure(outputs);
    configured = true;
  } catch {
    // Backend not deployed yet. Screens that need data should show an empty/
    // error state (see requirements 7.3). Auth/data calls will fail until
    // `npx ampx sandbox` has run.
    configured = false;
  }
  return configured;
}

/** Whether a backend config was found and Amplify is configured. */
export function isAmplifyConfigured(): boolean {
  return configured;
}
