// AskBox: the scheduling-assistant input on the Calendar tab.
//
// Sends the message to the askAgent mutation, renders the text reply plus any
// estimate/schedule cards, and — when the agent schedules a visit — mirrors it
// into local household state so the calendar refreshes immediately
// (Requirement 6.4). Shows a friendly error if Bedrock/the backend is
// unavailable and stays usable (Requirement 6.6).

import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, IconButton, ActivityIndicator, Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { askAgent, isAgentAvailable, type AgentReply } from '../lib/agent';
import { useHousehold } from '../lib/useHousehold';
import { AgentCards } from './AgentCards';

const SUGGESTIONS = [
  'Schedule the kids’ cleanings before year end',
  'What will Sam’s crown cost?',
  'When should we book the sealants?',
];

export function AskBox() {
  const theme = useTheme();
  const { scheduleVisit } = useHousehold();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<AgentReply | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await askAgent(q);
      setReply(res);
      // Mirror any scheduled visits into local state so the calendar updates now.
      for (const card of res.cards) {
        if (card.type === 'schedule' && card.data?.memberId && card.data?.treatmentItemId && card.data?.date) {
          scheduleVisit({
            memberId: card.data.memberId,
            treatmentItemId: card.data.treatmentItemId,
            date: card.data.date,
          });
        }
      }
      setMessage('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      setError(
        msg === 'BACKEND_NOT_CONFIGURED'
          ? "The scheduling assistant isn’t connected in this build. Deploy the backend (npx ampx sandbox) to chat with it."
          : "I couldn’t reach the assistant just now. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="robot-happy-outline" size={20} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Ask the scheduling assistant
          </Text>
        </View>

        <TextInput
          mode="outlined"
          placeholder="e.g. Schedule the kids’ cleanings, we have $150 a month"
          value={message}
          onChangeText={setMessage}
          multiline
          onSubmitEditing={() => send(message)}
          right={
            <TextInput.Icon
              icon="send"
              accessibilityLabel="Send message to the scheduling assistant"
              disabled={loading || message.trim().length === 0}
              onPress={() => send(message)}
            />
          }
        />

        {!reply && !loading && !error && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} compact onPress={() => send(s)} style={styles.chip}>
                {s}
              </Chip>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator animating size="small" />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Thinking…
            </Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorBox, { borderColor: theme.colors.error }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.error} />
            <Text variant="bodySmall" style={{ color: theme.colors.error, flex: 1 }}>
              {error}
            </Text>
          </View>
        )}

        {reply && (
          <View style={{ marginTop: 12 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {reply.text}
            </Text>
            <AgentCards cards={reply.cards} />
          </View>
        )}

        {!isAgentAvailable() && !error && !reply && (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Tip: run the backend to enable live scheduling chat.
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, borderRadius: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {},
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
});
