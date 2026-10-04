// Cards rendered under the agent's text answer. The agent returns the numbers
// (computed by the engine inside the Lambda tools); these just display them.

import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moneyCents, monthLabel } from '../lib/format';
import { brand } from '../theme/colors';
import type { AgentCard } from '../lib/agent';

export function AgentCards({ cards }: { cards: AgentCard[] }) {
  if (!cards?.length) return null;
  return (
    <View style={{ gap: 10, marginTop: 10 }}>
      {cards.map((c, i) =>
        c.type === 'estimate' ? (
          <EstimateCard key={i} data={c.data} />
        ) : c.type === 'schedule' ? (
          <ScheduleCard key={i} data={c.data} />
        ) : null,
      )}
    </View>
  );
}

function EstimateCard({ data }: { data: any }) {
  const theme = useTheme();
  const lines: any[] = Array.isArray(data?.lines) ? data.lines : [];
  const total = data?.total ?? { member: 0, insurer: 0 };

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calculator-variant" size={18} color={theme.colors.primary} />
          <Text variant="titleSmall" style={{ fontWeight: '700' }}>
            Estimate{data?.firstName ? ` for ${data.firstName}` : ''}
          </Text>
        </View>
        {lines.map((l, idx) => (
          <View key={idx} style={styles.line}>
            <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
              {l.code}
            </Text>
            <Text variant="bodySmall">You owe {moneyCents(l.memberOwes ?? 0)}</Text>
          </View>
        ))}
        <Divider style={{ marginVertical: 6 }} />
        <View style={styles.line}>
          <Text variant="titleSmall" style={{ fontWeight: '700', flex: 1 }}>
            Estimated total
          </Text>
          <Text variant="titleSmall" style={{ fontWeight: '800', color: theme.colors.primary }}>
            {moneyCents(total.member ?? 0)}
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          This is an estimate, not a bill.
        </Text>
      </Card.Content>
    </Card>
  );
}

function ScheduleCard({ data }: { data: any }) {
  const theme = useTheme();
  const month = typeof data?.date === 'string' ? data.date.slice(0, 7) : undefined;
  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-check" size={18} color={brand.success} />
          <Text variant="titleSmall" style={{ fontWeight: '700' }}>
            Visit scheduled
          </Text>
        </View>
        <Text variant="bodyMedium">
          {month ? monthLabel(month) : data?.date} · you’ll owe {moneyCents(data?.memberOwes ?? 0)}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
});
