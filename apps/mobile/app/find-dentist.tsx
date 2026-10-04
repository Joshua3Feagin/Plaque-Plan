import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';

import { brand } from '../theme/colors';
import { MaroonHeaderCard, SectionHeading, ListCard } from '../components/ui/primitives';

// No mockup exists for this screen; styled to match the established visual system
// (maroon header, list cards, orange accents). Lists a few sample in-network
// providers from the appointments demo data.
const PROVIDERS = [
  { name: 'Dr. Patel Family Dental', address: '120 Main St, Notre Dame, IN', miles: '1.2 mi' },
  { name: 'Bright Smiles Orthodontics', address: '48 Elm St, South Bend, IN', miles: '2.4 mi' },
  { name: 'Lincoln Park Dental Group', address: '300 Oak Ave, South Bend, IN', miles: '3.1 mi' },
  { name: 'Riverside Dental Care', address: '77 River Rd, Mishawaka, IN', miles: '4.8 mi' },
];

export default function FindDentist() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : router.push('/(tabs)/home'));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme.colors.primary}
            onPress={goBack}
            accessibilityLabel="Go back"
          />
          <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
            Find a dentist
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <MaroonHeaderCard>
          <Text variant="labelMedium" style={styles.kicker}>
            IN-NETWORK CARE
          </Text>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Dentists near you
          </Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            In-network providers keep your costs lowest.
          </Text>
        </MaroonHeaderCard>

        <SectionHeading>Nearby providers</SectionHeading>
        <View style={{ gap: 12 }}>
          {PROVIDERS.map((p) => (
            <ListCard
              key={p.name}
              left={
                <View style={styles.pin}>
                  <MaterialCommunityIcons name="map-marker" size={22} color={brand.primary} />
                </View>
              }
              title={p.name}
              subtitle={`${p.address} · ${p.miles}`}
              onPress={() =>
                Linking.openURL(
                  `https://maps.google.com/?q=${encodeURIComponent(`${p.name} ${p.address}`)}`,
                ).catch(() => {})
              }
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  headerSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
