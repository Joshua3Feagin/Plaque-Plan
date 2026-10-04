// Shared UI primitives used across the mockup screens. Build once, reuse
// everywhere (Requirement notes). All colors come from the theme / brand tokens.

import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brand } from '../../theme/colors';
import { initial } from '../../lib/format';

/** Burgundy rounded header card (Home plan card, Account header, Category header). */
export function MaroonHeaderCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const content = <View style={[styles.maroon, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

/** Burgundy section heading, e.g. "Family members" / "Plan usage". */
export function SectionHeading({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.primary }}>
        {children}
      </Text>
      {right}
    </View>
  );
}

/** A rounded surface row with optional left node, title/subtitle, and chevron. */
export function ListCard({
  left,
  title,
  subtitle,
  onPress,
  showChevron = true,
  accessibilityLabel,
}: {
  left?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.listCard,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {left}
      <View style={{ flex: 1 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron && onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      ) : null}
    </Pressable>
  );
}

/** Colored circle with a member's initial. */
export function AvatarBadge({
  name,
  color,
  size = 48,
  tint,
}: {
  name: string;
  color: string;
  size?: number;
  /** If true, use a soft tinted background with colored text (Home list style). */
  tint?: boolean;
}) {
  const bg = tint ? softTint(color) : color;
  const fg = tint ? color : '#FFFFFF';
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: bg },
      ]}
    >
      <Text style={{ color: fg, fontWeight: '800', fontSize: size * 0.4 }}>{initial(name)}</Text>
    </View>
  );
}

/** Soft orange/colored pill, e.g. coverage "100%" or a date "Oct 6". */
export function Pill({
  children,
  color = brand.accent,
  bg = brand.accentContainer,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text variant="labelLarge" style={{ color, fontWeight: '800' }}>
        {children}
      </Text>
    </View>
  );
}

/** A coverage breakdown row: label on the left, percentage pill on the right. */
export function CoverageRow({
  label,
  percent,
  onPress,
  last,
}: {
  label: string;
  percent: number;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.coverageRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.colors.outline }]}
    >
      <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary, flex: 1 }}>
        {label}
      </Text>
      <Pill>{`${Math.round(percent * 100)}%`}</Pill>
    </Pressable>
  );
}

/** Lighten a #rrggbb hex toward white for soft avatar/pill tints. */
function softTint(hex: string, amount = 0.8): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const styles = StyleSheet.create({
  maroon: {
    backgroundColor: brand.primary,
    borderRadius: 18,
    padding: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 64,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
});
