// FamilyCalendar: a month view marking each member's visits with their color.
//
// Recommended visits (from the optimizer) and scheduled visits are both dots in
// the member's color; scheduled ones are drawn solid while recommended ones are
// lighter/outlined so they read as "suggested, not yet booked" (Requirement 6.2).
// react-native-calendars multi-dot marking is used; the selected day is ringed.

import { useMemo } from 'react';
import { Calendar, type DateData } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';

import { useHousehold, type Visit } from '../lib/useHousehold';
import { memberColor } from '../theme/colors';

export interface FamilyCalendarProps {
  selected: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

/** Lighten a #rrggbb hex toward white by `amount` (0..1) for recommended dots. */
function lighten(hex: string, amount = 0.55): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function FamilyCalendar({ selected, onSelect }: FamilyCalendarProps) {
  const theme = useTheme();
  const { visits, members, today } = useHousehold();

  // Stable color per member by their index in the household.
  const colorForMember = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m, i) => (map[m.id] = memberColor(i)));
    return map;
  }, [members]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }> = {};

    const addDot = (v: Visit) => {
      const base = colorForMember[v.memberId] ?? theme.colors.primary;
      const color = v.status === 'scheduled' ? base : lighten(base);
      if (!marks[v.date]) marks[v.date] = { dots: [] };
      // Dedupe by member+status so a member shows at most one dot per state per day.
      const key = `${v.memberId}-${v.status}`;
      if (!marks[v.date].dots.some((d) => d.key === key)) {
        marks[v.date].dots.push({ key, color });
      }
    };

    visits.forEach(addDot);

    // Mark the selected day.
    marks[selected] = {
      ...(marks[selected] ?? { dots: [] }),
      selected: true,
      selectedColor: theme.colors.primaryContainer,
    };

    return marks;
  }, [visits, colorForMember, selected, theme.colors]);

  return (
    <Calendar
      current={selected || today}
      onDayPress={(d: DateData) => onSelect(d.dateString)}
      markingType="multi-dot"
      markedDates={markedDates}
      firstDay={0}
      theme={{
        backgroundColor: theme.colors.surface,
        calendarBackground: theme.colors.surface,
        textSectionTitleColor: theme.colors.onSurfaceVariant,
        monthTextColor: theme.colors.onSurface,
        dayTextColor: theme.colors.onSurface,
        textDisabledColor: theme.colors.outline,
        todayTextColor: theme.colors.primary,
        selectedDayTextColor: theme.colors.onPrimary,
        arrowColor: theme.colors.primary,
      }}
      style={{ borderRadius: 14, overflow: 'hidden' }}
    />
  );
}
