import { Redirect } from 'expo-router';

// Entry route: send users to the Profile tab.
export default function Index() {
  return <Redirect href="/(tabs)/profile" />;
}
