// AuthGate: shows the Amplify (Cognito) Authenticator before the app when a
// backend is configured (Requirement 1.1), so each user only sees the household
// they own (Requirement 1.2). In the local demo build — before `npx ampx
// sandbox` has written amplify_outputs.json — there is no user pool to talk to,
// so we bypass sign-in and run against the seeded Rivera household. A small
// banner makes the demo mode obvious.

import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Authenticator } from '@aws-amplify/ui-react-native';

import { isAmplifyConfigured } from '../lib/amplify';

export function AuthGate({ children }: { children: React.ReactNode }) {
  // No backend configured: local demo. Skip auth so the app stays fully usable.
  if (!isAmplifyConfigured()) {
    return (
      <View style={{ flex: 1 }}>
        <DemoBanner />
        {children}
      </View>
    );
  }

  // Backend configured: require Cognito sign-in. The seeded judge account signs
  // in here (Requirement 1.3); each user then loads only their own household.
  return <Authenticator.Provider>
    <Authenticator>{children}</Authenticator>
  </Authenticator.Provider>;
}

function DemoBanner() {
  const theme = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}
      >
        Demo mode — showing the sample Rivera family. Sign-in turns on once the backend is connected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 4, paddingHorizontal: 12 },
});
