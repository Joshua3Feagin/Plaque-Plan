import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { CATEGORY_BY_KEY } from '../../../lib/benefits';
import { brand } from '../../../theme/colors';
import { MaroonHeaderCard, SectionHeading } from '../../../components/ui/primitives';

// Reusable Category Detail template, driven by the category key in the route.
export default function CategoryDetail() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { category } = useLocalSearchParams<{ category: string }>();
  const data = CATEGORY_BY_KEY[category ?? ''];

  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : router.push('/(tabs)/benefits');

  if (!data) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.topBar}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} onPress={goBack} />
          <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
            Benefits
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={{ padding: 16, color: theme.colors.onSurfaceVariant }}>Category not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme.colors.primary}
            onPress={goBack}
            accessibilityLabel="Back to Benefits"
          />
          <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
            Benefits
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Maroon category header */}
        <MaroonHeaderCard>
          <Text variant="labelMedium" style={styles.kicker}>
            COVERAGE CATEGORY
          </Text>
          <Text variant="displaySmall" style={styles.title}>
            {data.name}
          </Text>
          <Text variant="bodyMedium" style={styles.summary}>
            {data.summary}
          </Text>
        </MaroonHeaderCard>

        <SectionHeading>What&apos;s included</SectionHeading>
        <View style={{ gap: 10 }}>
          {data.included.map((item) => (
            <View
              key={item}
              style={[styles.row, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.check}>
                <MaterialCommunityIcons name="check" size={16} color={brand.primary} />
              </View>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                {item}
              </Text>
            </View>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  title: { color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  summary: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 60,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
