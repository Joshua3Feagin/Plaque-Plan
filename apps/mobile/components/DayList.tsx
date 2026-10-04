// DayList: the visits on the selected calendar day — who, what, and what they'll
// owe. Recommended visits get an "Accept" button that flips them to scheduled
// (Requirement 6.1, 6.2). All amounts come from the optimizer via useHousehold.

import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Chip, useTheme } from 'react-native-paper';

import { useHousehold } from '../lib/useHousehold';
import { memberColor } from '../theme/colors';
import { initial, moneyCents } from '../lib/format';

export interface DayListProps {
  date: string; // YYYY-MM-DD
}

export function DayList({ date }: DayListProps) {
  const theme = useTheme();
  const { visitsOn, members, catalog, getMember, acceptRecommendation } = useHousehold();

  const colorForMember = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m, i) => (map[m.id] = memberColor(i)));
    return map;
  }, [members]);

  const visits = visitsOn(date);
  const prettyDate = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [date]);

  return (
    <View style={styles.wrap}>
      <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
        {prettyDate}
      </Text>

      {visits.length === 0 ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Nothing planned this day. Tap a day with a colored dot to see suggested visits.
        </Text>
      ) : (
        visits.map((v) => {
          const member = getMember(v.memberId);
          const proc = catalog.get(v.code);
          const color = colorForMember[v.memberId] ?? theme.colors.primary;
          return (
            <View
              key={v.id}
              style={[styles.row, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{initial(member?.firstName ?? '?')}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {member?.firstName ?? 'Member'} · {proc?.plainName ?? v.code}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  You owe {moneyCents(v.memberOwes)}
                </Text>
              </View>

              {v.status === 'scheduled' ? (
                <Chip icon="check" compact style={{ backgroundColor: theme.colors.surfaceVariant }}>
                  Scheduled
                </Chip>
              ) : (
                <Button
                  mode="contained"
                  compact
                  onPress={() => acceptRecommendation(v.id)}
                  accessibilityLabel={`Accept recommended visit for ${member?.firstName ?? 'member'}, ${proc?.plainName ?? v.code}`}
                >
                  Accept
                </Button>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 10,
    minHeight: 64,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
