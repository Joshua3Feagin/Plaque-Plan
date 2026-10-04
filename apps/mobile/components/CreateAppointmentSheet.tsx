// CreateAppointmentSheet: a modal to add an appointment on a chosen date.
//
// No mockup exists for this flow, so it follows the established style: maroon
// header, card patterns, a color-coded family-member selector, and a procedure
// picker from the catalog. On save it adds a treatment item for the member and
// schedules a visit on the selected date, so it shows on the calendar immediately.

import { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useHousehold } from '../lib/useHousehold';
import { memberColor, brand } from '../theme/colors';
import { initial } from '../lib/format';
import { AvatarBadge } from './ui/primitives';

export function CreateAppointmentSheet({
  visible,
  date,
  onClose,
}: {
  visible: boolean;
  date: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { members, catalog, addTreatmentItem, scheduleVisit } = useHousehold();

  const [memberId, setMemberId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const procedures = useMemo(() => Array.from(catalog.values()).slice(0, 8), [catalog]);
  const prettyDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const reset = () => {
    setMemberId(null);
    setCode(null);
  };

  const canSave = Boolean(memberId && code && date);

  const save = () => {
    if (!memberId || !code || !date) return;
    // Add a flexible treatment item, then schedule it on the chosen date.
    const itemId = addTreatmentItem({ memberId, code, urgency: 'flexible', inNetwork: true });
    scheduleVisit({ memberId, treatmentItemId: itemId, date });
    reset();
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          reset();
          onClose();
        }}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        {/* Maroon header */}
        <View style={styles.header}>
          <Text variant="labelMedium" style={styles.kicker}>
            NEW APPOINTMENT
          </Text>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {prettyDate}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
            Who is it for?
          </Text>
          <View style={styles.memberRow}>
            {members.map((m, i) => {
              const selected = memberId === m.id;
              const c = memberColor(i);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMemberId(m.id)}
                  style={[
                    styles.memberChip,
                    { borderColor: selected ? c : theme.colors.outline, borderWidth: selected ? 2 : 1 },
                  ]}
                  accessibilityLabel={`Select ${m.firstName}`}
                >
                  <AvatarBadge name={m.firstName} color={c} size={36} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                    {m.firstName}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
            What's the visit?
          </Text>
          <View style={{ gap: 8 }}>
            {procedures.map((p) => {
              const selected = code === p.code;
              return (
                <Pressable
                  key={p.code}
                  onPress={() => setCode(p.code)}
                  style={[
                    styles.procRow,
                    {
                      borderColor: selected ? brand.accent : theme.colors.outline,
                      backgroundColor: selected ? brand.accentContainer : theme.colors.surface,
                    },
                  ]}
                >
                  <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '700', flex: 1 }}>
                    {p.plainName}
                  </Text>
                  {selected && <MaterialCommunityIcons name="check-circle" size={20} color={brand.accent} />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button mode="contained" style={styles.btn} buttonColor={brand.accent} disabled={!canSave} onPress={save}>
            Add appointment
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 16, borderRadius: 20, overflow: 'hidden', maxHeight: '85%' },
  header: { backgroundColor: brand.primary, padding: 18 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  body: { padding: 16 },
  sectionLabel: { fontWeight: '800', marginTop: 8, marginBottom: 10 },
  memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  memberChip: { alignItems: 'center', padding: 10, borderRadius: 14, width: 84 },
  procRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
  btn: { flex: 1, borderRadius: 12 },
});
