// AuthGate: gates the app behind sign-in (Requirement 1.1).
//
// - Backend configured: use the Amplify (Cognito) Authenticator so each user
//   loads only their own household (Requirement 1.2); the seeded judge account
//   signs in here (Requirement 1.3).
// - Local demo (no amplify_outputs.json): show the custom Sign-In screen
//   (signin_screen.png). Signing in proceeds to the app against the seeded
//   household so every screen is usable without a backend.

import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react-native';

import { isAmplifyConfigured } from '../lib/amplify';
import { SignInScreen } from './SignInScreen';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);

  if (!isAmplifyConfigured()) {
    if (!signedIn) return <SignInScreen onSignedIn={() => setSignedIn(true)} />;
    return <>{children}</>;
  }

  return (
    <Authenticator.Provider>
      <Authenticator>{children}</Authenticator>
    </Authenticator.Provider>
  );
}
