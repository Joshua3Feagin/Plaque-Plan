import { Redirect } from 'expo-router';

// Entry route: send users to the Home tab.
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
