import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  HelperText,
  List,
  RadioButton,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useHousehold, type Relation } from '../../../lib/useHousehold';
import { PLANS } from '@maxout/seed';

export default function AddMemberScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { addMember } = useHousehold();

  const [firstName, setFirstName] = useState('');
  const [relation, setRelation] = useState<Relation>('child');
  const [birthYear, setBirthYear] = useState('');
  const [planId, setPlanId] = useState(PLANS[0].id);
  const [submitted, setSubmitted] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(birthYear, 10);

  const nameError = submitted && firstName.trim().length === 0;
  const yearError =
    submitted && (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > currentYear);

  const canSubmit = useMemo(
    () => firstName.trim().length > 0 && Number.isFinite(yearNum) && yearNum >= 1900 && yearNum <= currentYear,
    [firstName, yearNum, currentYear],
  );

  const onSubmit = () => {
    setSubmitted(true);
    if (!canSubmit) return;
    addMember({ firstName: firstName.trim(), relation, birthYear: yearNum, planId });
    router.back();
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Everyone on your plan. We only need a first name, relation, birth year, and plan.
        </Text>

        <TextInput
          mode="outlined"
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          error={nameError}
          style={styles.field}
          autoCapitalize="words"
        />
        <HelperText type="error" visible={nameError}>
          Please enter a first name.
        </HelperText>

        <Text variant="labelLarge" style={styles.label}>
          Relation
        </Text>
        <SegmentedButtons
          value={relation}
          onValueChange={(v) => setRelation(v as Relation)}
          buttons={[
            { value: 'self', label: 'You' },
            { value: 'spouse', label: 'Spouse' },
            { value: 'child', label: 'Child' },
          ]}
        />

        <TextInput
          mode="outlined"
          label="Birth year"
          value={birthYear}
          onChangeText={(t) => setBirthYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          error={yearError}
          style={[styles.field, { marginTop: 16 }]}
        />
        <HelperText type="error" visible={yearError}>
          Enter a year between 1900 and {currentYear}.
        </HelperText>

        <Text variant="labelLarge" style={styles.label}>
          Plan
        </Text>
        <RadioButton.Group onValueChange={setPlanId} value={planId}>
          {PLANS.map((p) => (
            <List.Item
              key={p.id}
              title={p.name}
              description={`$${p.annualMax.toLocaleString()} max · $${p.deductible} deductible`}
              onPress={() => setPlanId(p.id)}
              left={() => <RadioButton value={p.id} />}
              titleStyle={{ fontWeight: '600' }}
            />
          ))}
        </RadioButton.Group>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.btn}>
            Cancel
          </Button>
          <Button mode="contained" onPress={onSubmit} style={styles.btn}>
            Add member
          </Button>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 4 },
  field: { marginTop: 12 },
  label: { marginTop: 12, marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, borderRadius: 12 },
});
