import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useHousehold } from '../../lib/useHousehold';
import { relationLabel } from '../../lib/format';
import { accountRelationLabel } from '../../lib/account';
import { memberColor, brand } from '../../theme/colors';
import {
  MaroonHeaderCard,
  SectionHeading,
  ListCard,
  AvatarBadge,
} from '../../components/ui/primitives';
import { BenefitReminderBanner } from '../../components/BenefitReminderBanner';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { household, plan, members } = useHousehold();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting + family name with the Lincoln "Larry" mark. */}
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: brand.accent }]}>
            <MaterialCommunityIcons name="tooth" size={26} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {greeting()}
            </Text>
            <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.primary }}>
              The {household.name} Family
            </Text>
          </View>
        </View>

        {/* Current plan card -> coverage details (Benefits). */}
        <MaroonHeaderCard style={styles.planCard} onPress={() => router.push('/(tabs)/benefits')}>
          <View style={styles.planRow}>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.planKicker}>
                CURRENT PLAN
              </Text>
              <Text variant="headlineSmall" style={styles.planName}>
                {plan.name}
              </Text>
              <Text variant="bodyMedium" style={styles.planSub}>
                Tap to view coverage details
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={26} color="rgba(255,255,255,0.8)" />
          </View>
        </MaroonHeaderCard>

        <BenefitReminderBanner />

        {/* Family members */}
        <SectionHeading
          right={
            <Text
              variant="titleSmall"
              onPress={() => router.push('/(tabs)/profile')}
              style={{ color: brand.accent, fontWeight: '800' }}
            >
              See all
            </Text>
          }
        >
          Family members
        </SectionHeading>

        <View style={{ gap: 12 }}>
          {members.map((m, i) => (
            <ListCard
              key={m.id}
              left={<AvatarBadge name={m.firstName} color={memberColor(i)} tint />}
              title={m.firstName}
              subtitle={m.relation === 'self' ? accountRelationLabel(m.relation) : relationLabel(m.relation)}
              onPress={() => router.push(`/(tabs)/profile/${m.id}`)}
              accessibilityLabel={`Open ${m.firstName}'s account`}
            />
          ))}
        </View>

        {/* Quick actions */}
        <SectionHeading>Quick actions</SectionHeading>
        <View style={{ gap: 12 }}>
          <ListCard
            left={<QuickIcon icon="map-marker-radius" />}
            title="Find a dentist"
            onPress={() => router.push('/find-dentist')}
          />
          <ListCard
            left={<QuickIcon icon="calendar-month" />}
            title="Calendar"
            onPress={() => router.push('/(tabs)/calendar')}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickIcon({ icon }: { icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.quickIcon}>
      <MaterialCommunityIcons name={icon} size={22} color={brand.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  planCard: { marginTop: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planKicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  planName: { color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  planSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
