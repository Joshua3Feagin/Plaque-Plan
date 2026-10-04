// Ambient declaration for the Amplify-generated per-function env module.
// At deploy time Amplify generates `$amplify/env/agent` with typed env vars; this
// stub lets `tsc` type-check the handler locally before that generation runs.
declare module '$amplify/env/agent' {
  export const env: {
    BEDROCK_MODEL_ID: string;
    BEDROCK_REGION: string;
    // Injected by the Lambda runtime / Amplify data config.
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SESSION_TOKEN: string;
    AWS_REGION: string;
    AMPLIFY_DATA_DEFAULT_NAME: string;
    [key: string]: string | undefined;
  };
}
