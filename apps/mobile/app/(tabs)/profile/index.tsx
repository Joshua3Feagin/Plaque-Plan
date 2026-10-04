import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useHousehold } from '../../../lib/useHousehold';
import { HouseholdHeader } from '../../../components/HouseholdHeader';
import { MemberRow } from '../../../components/MemberRow';

export default function HouseholdScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loading, household, plan, members, waste, schedule } = useHousehold();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
          Loading your household…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <HouseholdHeader
            name={household.name}
            planName={plan.name}
            monthlyBudget={household.monthlyBudget}
            expiringTotal={waste.total}
            daysLeft={waste.daysLeft}
            savings={schedule.savings}
          />
        }
        renderItem={({ item, index }) => (
          <MemberRow
            member={item}
            index={index}
            annualMax={plan.annualMax}
            onPress={() => router.push(`/(tabs)/profile/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No family members yet</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Add the people on your plan to see what each can still use this year.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Button
            mode="contained"
            icon="account-plus"
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/profile/add')}
          >
            Add family member
          </Button>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  addBtn: { marginTop: 20, borderRadius: 12 },
});
