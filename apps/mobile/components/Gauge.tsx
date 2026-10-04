// Gauge: an SVG arc showing how much of a benefit is left vs used.
// Used large on the member profile and small (mini) in member rows.

import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Text, useTheme } from 'react-native-paper';
import { money } from '../lib/format';

export interface GaugeProps {
  /** Amount already used. */
  used: number;
  /** Total available (annual max). */
  total: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. */
  stroke?: number;
  /** Accent color for the "left" arc; defaults to theme primary. */
  color?: string;
  /** Hide the center label (used for the mini gauge). */
  hideLabel?: boolean;
  /** Optional caption under the big number. */
  caption?: string;
}

export function Gauge({
  used,
  total,
  size = 140,
  stroke = 12,
  color,
  hideLabel = false,
  caption = 'left to use',
}: GaugeProps) {
  const theme = useTheme();
  const left = Math.max(0, total - used);
  const fraction = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * fraction;
  const accent = color ?? theme.colors.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Rotate so the arc starts at the top. */}
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash}, ${circumference}`}
            fill="none"
          />
        </G>
      </Svg>
      {!hideLabel && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text variant="titleLarge" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            {money(left)}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {caption}
          </Text>
        </View>
      )}
    </View>
  );
}
