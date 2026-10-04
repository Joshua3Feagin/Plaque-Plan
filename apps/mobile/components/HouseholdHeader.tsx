// HouseholdHeader: household name, plan, monthly budget, and two banners:
//  - expiring benefits ("$X of benefits expire in N days")
//  - savings from the recommended schedule ("Save $Y vs booking everything now")
// All figures come from the engine via useHousehold — nothing hard-coded.

import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '../theme/colors';
import { money } from '../lib/format';

export interface HouseholdHeaderProps {
  name: string;
  planName: string;
  monthlyBudget: number;
  expiringTotal: number;
  daysLeft: number;
  savings: number;
}

export function HouseholdHeader({
  name,
  planName,
  monthlyBudget,
  expiringTotal,
  daysLeft,
  savings,
}: HouseholdHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
        The {name} family
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {planName} · {money(monthlyBudget)}/month budget
      </Text>

      {expiringTotal > 0 && (
        <Banner
          icon="clock-alert-outline"
          tint={brand.warning}
          title={`${money(expiringTotal)} of benefits expire in ${daysLeft} days`}
          body="Use it before your plan year ends, or you lose it."
        />
      )}

      {savings > 0 && (
        <Banner
          icon="piggy-bank-outline"
          tint={brand.success}
          title={`Save ${money(savings)} with the recommended plan`}
          body="Compared with booking everything right now."
        />
      )}
    </View>
  );
}

function Banner({
  icon,
  tint,
  title,
  body,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  title: string;
  body: string;
}) {
  const theme = useTheme();
  return (
    <Card mode="contained" style={[styles.banner, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.bannerContent}>
        <View style={[styles.iconChip, { backgroundColor: tint }]}>
          <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: tint }}>
            {title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {body}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 8 },
  banner: { marginTop: 12, borderRadius: 14 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
