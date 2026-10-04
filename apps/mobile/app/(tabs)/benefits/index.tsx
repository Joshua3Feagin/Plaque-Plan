import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { COVERAGE_CATEGORIES, LARRY_SUGGESTIONS } from '../../../lib/benefits';
import { brand } from '../../../theme/colors';
import { SectionHeading, ListCard } from '../../../components/ui/primitives';

export default function BenefitsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const openChat = (prefill?: string) =>
    router.push({ pathname: '/(tabs)/benefits/chat', params: prefill ? { prefill } : {} });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Benefits
        </Text>
        <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.primary, marginBottom: 12 }}>
          Coverage & help
        </Text>

        {/* Lincoln Larry assistant */}
        <View style={styles.larryHeader}>
          <View style={[styles.larryMark, { backgroundColor: brand.primary }]}>
            <MaterialCommunityIcons name="star-four-points" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
              Lincoln Larry
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Your AI benefits assistant
            </Text>
          </View>
        </View>

        {/* Tappable input bar -> chat */}
        <Pressable
          style={[styles.inputBar, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
          onPress={() => openChat()}
          accessibilityRole="button"
          accessibilityLabel="Ask Lincoln Larry"
        >
          <MaterialCommunityIcons name="star-four-points" size={20} color={brand.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Ask Lincoln Larry anything…
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              e.g. “How much will a root canal cost me?”
            </Text>
          </View>
          <View style={[styles.sendFab, { backgroundColor: brand.accent }]}>
            <MaterialCommunityIcons name="chevron-up" size={22} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Suggestion chips: populate the chat input, do not auto-send */}
        <View style={styles.chips}>
          {LARRY_SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => openChat(s)}
              style={[styles.chip, { borderColor: theme.colors.outline }]}
              accessibilityRole="button"
              accessibilityLabel={`Ask: ${s}`}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Procedures & coverage categories */}
        <SectionHeading>Procedures &amp; coverage</SectionHeading>
        <View style={{ gap: 12 }}>
          {COVERAGE_CATEGORIES.map((c) => (
            <ListCard
              key={c.key}
              title={c.name}
              onPress={() => router.push(`/(tabs)/benefits/${c.key}`)}
              accessibilityLabel={`${c.name} coverage details`}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  larryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  larryMark: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  sendFab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: 999 },
});
