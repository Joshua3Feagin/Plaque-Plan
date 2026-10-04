import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { askKb, isKbAvailable, sourceName, type KbReply } from '../../../lib/kb';
import { brand } from '../../../theme/colors';

interface Turn {
  role: 'user' | 'larry';
  text: string;
  reply?: KbReply;
}

export default function LarryChat() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();

  // A suggestion chip prefills the input but does NOT auto-send (per spec).
  const [input, setInput] = useState(typeof prefill === 'string' ? prefill : '');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (typeof prefill === 'string') setInput(prefill);
  }, [prefill]);

  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : router.push('/(tabs)/benefits');

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setTurns((t) => [...t, { role: 'user', text: q }]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const reply = await askKb(q);
      setTurns((t) => [...t, { role: 'larry', text: reply.answer, reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      setError(
        msg === 'BACKEND_NOT_CONFIGURED'
          ? 'Lincoln Larry isn’t connected in this build. Deploy the backend to ask about your coverage.'
          : 'Larry couldn’t answer just now. Please try again in a moment.',
      );
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={28}
          color={theme.colors.primary}
          onPress={goBack}
          accessibilityLabel="Back to Benefits"
        />
        <View style={styles.titleRow}>
          <View style={[styles.mark, { backgroundColor: brand.primary }]}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#FFFFFF" />
          </View>
          <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
            Lincoln Larry
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
          {turns.length === 0 && !loading && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Ask about your dental coverage, benefits, deductibles, or what a procedure costs. Answers come from your plan documents.
            </Text>
          )}

          {turns.map((t, i) =>
            t.role === 'user' ? (
              <View key={i} style={[styles.userBubble, { backgroundColor: brand.accent }]}>
                <Text style={{ color: '#FFFFFF' }}>{t.text}</Text>
              </View>
            ) : (
              <View key={i} style={styles.larryBlock}>
                <View style={[styles.larryBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                  <Text style={{ color: theme.colors.onSurface }}>{t.text}</Text>
                </View>
                {t.reply ? <SourcesBlock reply={t.reply} /> : null}
              </View>
            ),
          )}

          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator animating size="small" />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Larry is checking your plan documents…
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
          {!isKbAvailable() && turns.length === 0 && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Tip: deploy the backend to ask Larry about your coverage.
            </Text>
          )}
        </ScrollView>

        <View style={[styles.inputRow, { borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
          <TextInput
            mode="outlined"
            style={{ flex: 1 }}
            placeholder="Ask about your dental coverage…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            right={
              <TextInput.Icon
                icon="send"
                accessibilityLabel="Send question to Lincoln Larry"
                disabled={loading || input.trim().length === 0}
                onPress={send}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Renders the knowledge-base source passages under an answer, plus a small
 *  banner when the answer is retrieval-only (AI summary not yet enabled). */
function SourcesBlock({ reply }: { reply: KbReply }) {
  const theme = useTheme();
  if (!reply.sources || reply.sources.length === 0) return null;

  return (
    <View style={{ marginTop: 8, gap: 8 }}>
      {reply.mode === 'retrieval-only' && (
        <View style={[styles.modeBanner, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="file-document-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
            Showing exact passages from your plan documents.
          </Text>
        </View>
      )}

      <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
        Sources
      </Text>
      {reply.sources.map((s, i) => (
        <View key={i} style={[styles.sourceCard, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
          {sourceName(s.uri) ? (
            <View style={styles.sourceHead}>
              <MaterialCommunityIcons name="file-document" size={14} color={brand.primary} />
              <Text variant="labelSmall" style={{ color: brand.primary, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {sourceName(s.uri)}
              </Text>
            </View>
          ) : null}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={4}>
            {s.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 16, gap: 10 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '85%', padding: 12, borderRadius: 16, borderBottomRightRadius: 4 },
  larryBlock: { alignSelf: 'stretch' },
  larryBubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  modeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  sourceCard: { padding: 10, borderWidth: 1, borderRadius: 10, gap: 4 },
  sourceHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, borderRadius: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
});
