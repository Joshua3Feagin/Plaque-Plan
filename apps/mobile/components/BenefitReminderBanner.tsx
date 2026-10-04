import { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { Text, IconButton, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getExpiringBenefits, type ExpiringBenefit } from '../src/reminders/getExpiringBenefits';
import { sendBenefitReminder, type ReminderEmail } from '../src/reminders/sendBenefitReminder';
import { DEMO_USER } from '../src/reminders/seeds';

const URGENCY_COLOR: Record<ExpiringBenefit['urgency'], string> = {
  expired: '#888888',
  critical: '#C0392B',
  warning: '#E67E22',
};

const URGENCY_BG: Record<ExpiringBenefit['urgency'], string> = {
  expired: '#F5F5F5',
  critical: '#FDEDEC',
  warning: '#FEF9E7',
};

export function BenefitReminderBanner() {
  const theme = useTheme();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [previewEmail, setPreviewEmail] = useState<ReminderEmail | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const benefits = getExpiringBenefits(30).filter((b) => !dismissed.has(b.id));

  if (benefits.length === 0) return null;

  const dismiss = (id: string) => setDismissed((prev) => new Set([...prev, id]));

  const handleSend = async (benefit: ExpiringBenefit) => {
    setSending(benefit.id);
    const email = await sendBenefitReminder(DEMO_USER, benefit);
    setSending(null);
    setPreviewEmail(email);
  };

  return (
    <>
      <View style={styles.container}>
        {benefits.map((b) => {
          const color = URGENCY_COLOR[b.urgency];
          const bg = URGENCY_BG[b.urgency];
          const label =
            b.daysRemaining < 0
              ? 'Expired'
              : b.daysRemaining === 0
              ? 'Expires today'
              : `${b.daysRemaining} day${b.daysRemaining === 1 ? '' : 's'} left`;

          return (
            <View key={b.id} style={[styles.card, { backgroundColor: bg, borderLeftColor: color }]}>
              <MaterialCommunityIcons
                name={b.urgency === 'expired' ? 'clock-remove-outline' : 'clock-alert-outline'}
                size={20}
                color={color}
                style={{ marginTop: 2 }}
              />
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text variant="titleSmall" style={{ fontWeight: '700', color, flex: 1 }}>
                    {b.name}
                  </Text>
                  <Text variant="labelSmall" style={{ color, fontWeight: '700' }}>
                    {label}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {b.description}
                </Text>
                {b.urgency !== 'expired' && (
                  <Button
                    mode="text"
                    compact
                    loading={sending === b.id}
                    onPress={() => handleSend(b)}
                    style={styles.emailBtn}
                    labelStyle={{ color, fontSize: 12 }}
                  >
                    Send me a reminder email
                  </Button>
                )}
              </View>
              <IconButton
                icon="close"
                size={16}
                onPress={() => dismiss(b.id)}
                style={styles.dismiss}
                iconColor={theme.colors.onSurfaceVariant}
                accessibilityLabel={`Dismiss ${b.name} reminder`}
              />
            </View>
          );
        })}
      </View>

      {/* Email preview modal (DEMO_MODE) */}
      <Modal
        visible={previewEmail !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewEmail(null)}
      >
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>
              Demo — Email preview
            </Text>
            <IconButton icon="close" onPress={() => setPreviewEmail(null)} />
          </View>
          <View style={[styles.demoTag, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
              DEMO MODE — not actually sent. Check console for the log.
            </Text>
          </View>
          {previewEmail && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                To
              </Text>
              <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                {previewEmail.to}
              </Text>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Subject
              </Text>
              <Text variant="bodyMedium" style={{ fontWeight: '700', marginBottom: 16 }}>
                {previewEmail.subject}
              </Text>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Body
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {previewEmail.text}
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emailBtn: { alignSelf: 'flex-start', marginTop: 4, marginLeft: -8 },
  dismiss: { margin: 0, marginTop: -4, marginRight: -8 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  demoTag: { marginHorizontal: 16, padding: 8, borderRadius: 6, marginBottom: 8 },
  modalContent: { padding: 16 },
});
