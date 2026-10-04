// SignInScreen: matches signin_screen.png. In the local demo (no backend) this
// is a visual sign-in that proceeds into the app on submit. When a backend is
// configured, AuthGate uses the real Amplify Authenticator instead.

import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '../theme/colors';

export function SignInScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        {/* Brand mark */}
        <View style={[styles.logo, { backgroundColor: brand.accent }]}>
          <MaterialCommunityIcons name="tooth" size={40} color="#FFFFFF" />
        </View>

        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Welcome back
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
          Sign in to manage your dental benefits
        </Text>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.primary }]}>
          Email
        </Text>
        <TextInput
          mode="outlined"
          placeholder="name@company.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.field}
        />

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.primary }]}>
          Password
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.field}
        />

        <Text
          variant="bodyMedium"
          style={{ color: brand.accent, fontWeight: '700', alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 }}
        >
          Forgot password?
        </Text>

        <Button
          mode="contained"
          buttonColor={brand.accent}
          style={styles.signInBtn}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontSize: 16, fontWeight: '800' }}
          onPress={onSignedIn}
        >
          Sign in
        </Button>

        <View style={styles.dividerRow}>
          <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 10 }}>
            or continue with
          </Text>
          <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
        </View>

        <View style={styles.social}>
          <SocialButton label="G" onPress={onSignedIn} />
          <SocialButton label="A" onPress={onSignedIn} />
        </View>

        <View style={{ flex: 1 }} />
        <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Don&apos;t have an account?{' '}
          <Text style={{ color: brand.accent, fontWeight: '800' }} onPress={onSignedIn}>
            Sign up
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.socialBtn, { borderColor: theme.colors.outline }]}
      accessibilityRole="button"
      accessibilityLabel={label === 'G' ? 'Continue with Google' : 'Continue with Apple'}
    >
      <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '800' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, padding: 24, paddingTop: 32 },
  logo: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  label: { fontWeight: '800', marginBottom: 6, marginTop: 8 },
  field: { marginBottom: 4 },
  signInBtn: { borderRadius: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1 },
  social: { flexDirection: 'row', gap: 14 },
  socialBtn: { flex: 1, height: 56, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
