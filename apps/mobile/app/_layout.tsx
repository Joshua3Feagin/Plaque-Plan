import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

import { paperTheme } from '../theme/colors';
import { configureAmplify } from '../lib/amplify';
import { HouseholdProvider } from '../lib/useHousehold';
import { AuthGate } from '../components/AuthGate';

// Configure Amplify at module load so sign-in gating is decided before the first
// render (AuthGate reads isAmplifyConfigured() synchronously). Safe to call
// before the backend exists — it no-ops when amplify_outputs.json is absent.
configureAmplify();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="light" backgroundColor={paperTheme.colors.primary} />
          <AuthGate>
            <HouseholdProvider>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: paperTheme.colors.primary },
                  headerTintColor: paperTheme.colors.onPrimary,
                  headerTitleStyle: { fontWeight: '600' },
                  contentStyle: { backgroundColor: paperTheme.colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="find-dentist" options={{ headerShown: false }} />
              </Stack>
            </HouseholdProvider>
          </AuthGate>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
