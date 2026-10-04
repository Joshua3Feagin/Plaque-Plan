import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHousehold } from '../../lib/useHousehold';
import { FamilyCalendar } from '../../components/FamilyCalendar';
import { CreateAppointmentSheet } from '../../components/CreateAppointmentSheet';
import { appointmentFor, shortDate } from '../../lib/appointments';
import { memberColor, brand } from '../../theme/colors';
import { Pill } from '../../components/ui/primitives';

export default function CalendarScreen() {
  const theme = useTheme();
  const { visits, members, catalog, getMember, household, today } = useHousehold();

  const [selected, setSelected] = useState<string>('');
  const [createDate, setCreateDate] = useState<string | null>(null);

  const colorForMember = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m, i) => (map[m.id] = memberColor(i)));
    return map;
  }, [members]);

  // Upcoming appointments: visits on/after today, sorted, mapped to display views.
  const upcoming = useMemo(
    () =>
      visits
        .filter((v) => v.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((v) => appointmentFor(v, getMember(v.memberId), catalog)),
    [visits, today, getMember, catalog],
  );

  const onSelectDate = (date: string) => {
    setSelected(date);
    // Tapping a date opens the Create Appointment flow (Requirement 5).
    setCreateDate(date);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          The {household.name} Family
        </Text>
        <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.primary, marginBottom: 8 }}>
          Calendar
        </Text>

        <FamilyCalendar selected={selected || today} onSelect={onSelectDate} />

        {/* Legend: one color per member */}
        <View style={styles.legend}>
          {members.map((m, i) => (
            <View key={m.id} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: memberColor(i) }]} />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {m.firstName}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.hr, { backgroundColor: theme.colors.outline }]} />

        <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.primary, marginBottom: 10 }}>
          Upcoming appointments
        </Text>

        {upcoming.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No upcoming appointments. Tap a date to add one.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {upcoming.map((a) => (
              <View
                key={a.id}
                style={[styles.apptCard, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
              >
                <View style={[styles.accent, { backgroundColor: colorForMember[a.memberId] ?? brand.primary }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={styles.apptTop}>
                    <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.primary, flex: 1 }}>
                      {a.title}
                    </Text>
                    <Pill
                      color={colorForMember[a.memberId] ?? brand.primary}
                      bg={theme.colors.surfaceVariant}
                    >
                      {shortDate(a.date)}
                    </Pill>
                  </View>
                  <Text variant="bodyMedium" style={{ color: colorForMember[a.memberId], fontWeight: '700' }}>
                    {a.memberName} · {a.time}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {a.provider} — {a.address}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <CreateAppointmentSheet
        visible={createDate !== null}
        date={createDate}
        onClose={() => setCreateDate(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  hr: { height: 1, marginVertical: 16 },
  apptCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, overflow: 'hidden', minHeight: 72 },
  accent: { width: 5 },
  apptTop: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, paddingTop: 12 },
});
