import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function ProfileStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Household' }} />
      <Stack.Screen name="[memberId]" options={{ title: 'Member' }} />
      <Stack.Screen name="add" options={{ title: 'Add family member', presentation: 'modal' }} />
    </Stack>
  );
}
