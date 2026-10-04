import { defineAuth } from '@aws-amplify/backend';

/**
 * Cognito auth for Plaque & Plan. Email sign-in; owner-based authorization on the data
 * models ties every household to the signed-in user (Requirement 1.2).
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
