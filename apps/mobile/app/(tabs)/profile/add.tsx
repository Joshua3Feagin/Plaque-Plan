import { Redirect } from 'expo-router';

// Add-family-member is not part of the new mockup-driven spec. Redirect any
// lingering navigation to the Profile (Account) screen.
export default function AddRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
