import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHousehold } from '../../lib/useHousehold';
import { FamilyCalendar } from '../../components/FamilyCalendar';
import { DayList } from '../../components/DayList';
import { AskBox } from '../../components/AskBox';

export default function CalendarScreen() {
  const theme = useTheme();
  const { visits, today } = useHousehold();

  // Default the selected day to the earliest upcoming visit so the demo lands on
  // something meaningful; fall back to today.
  const defaultDay = useMemo(() => {
    const upcoming = visits
      .map((v) => v.date)
      .filter((d) => d >= today)
      .sort();
    return upcoming[0] ?? today;
  }, [visits, today]);

  const [selected, setSelected] = useState(defaultDay);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Family calendar
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Dots show each person’s visits. Lighter dots are suggestions; solid dots
          are booked.
        </Text>

        <Legend />

        <View style={styles.calendarWrap}>
          <FamilyCalendar selected={selected} onSelect={setSelected} />
        </View>

        {visits.length === 0 ? (
          <Card mode="outlined" style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">No visits to show yet</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Add treatment to a family member’s care plan and the optimizer will
                suggest when to go.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <DayList date={selected} />
        )}

        {/* The "Ask" scheduling assistant box. */}
        <AskBox />
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend() {
  const theme = useTheme();
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Scheduled
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: 0.4 }]} />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Recommended
        </Text>
      </View>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 'auto' }}>
        One color per person
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 8 },
  title: { fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  calendarWrap: { marginTop: 12 },
  card: { marginTop: 16, borderRadius: 14 },
});
