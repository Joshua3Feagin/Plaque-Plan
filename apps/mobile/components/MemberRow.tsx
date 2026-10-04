// MemberRow: one tappable row in the household member list.
// Avatar initial in the member's color, name + relation, a mini gauge, and
// "left to use".

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Gauge } from './Gauge';
import { memberColor } from '../theme/colors';
import { initial, money, relationLabel } from '../lib/format';
import type { Member } from '../lib/useHousehold';

export interface MemberRowProps {
  member: Member;
  index: number;
  annualMax: number;
  onPress: () => void;
}

export function MemberRow({ member, index, annualMax, onPress }: MemberRowProps) {
  const theme = useTheme();
  const color = memberColor(index);
  const left = Math.max(0, annualMax - member.maxUsed);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.surfaceVariant }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${member.firstName}, ${relationLabel(member.relation)}, ${money(left)} left to use`}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initial(member.firstName)}</Text>
      </View>

      <View style={styles.info}>
        <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {member.firstName}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {relationLabel(member.relation)}
        </Text>
      </View>

      <View style={styles.gaugeWrap}>
        <Gauge used={member.maxUsed} total={annualMax} size={44} stroke={5} color={color} hideLabel />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
          {money(left)} left
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    gap: 12,
    minHeight: 72, // >= 44pt tap target
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  info: { flex: 1 },
  gaugeWrap: { alignItems: 'center', width: 72 },
});
