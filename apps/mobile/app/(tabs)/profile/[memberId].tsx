import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  List,
  Portal,
  Dialog,
  TextInput,
  SegmentedButtons,
  Searchbar,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import type BottomSheet from '@gorhom/bottom-sheet';
import type { Urgency } from '@maxout/engine';

import { useHousehold } from '../../../lib/useHousehold';
import { Gauge } from '../../../components/Gauge';
import { EstimateSheet } from '../../../components/EstimateSheet';
import { memberColor } from '../../../theme/colors';
import { money, moneyCents, monthLabel, relationLabel } from '../../../lib/format';

export default function MemberProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const {
    getMember,
    members,
    plan,
    catalog,
    itemsByMember,
    schedule,
    leftToUse,
    addTreatmentItem,
  } = useHousehold();

  const sheetRef = useRef<BottomSheet>(null);
  const [addVisible, setAddVisible] = useState(false);

  const member = getMember(memberId);
  const memberIndex = members.findIndex((m) => m.id === memberId);
  const color = memberColor(memberIndex < 0 ? 0 : memberIndex);

  const items = member ? itemsByMember(member.id) : [];

  // Next recommended visit for this member, by earliest month.
  const nextVisit = useMemo(() => {
    if (!member) return undefined;
    const mine = schedule.placements
      .filter((p) => items.some((it) => it.id === p.itemId))
      .sort((a, b) => a.month.localeCompare(b.month));
    return mine[0];
  }, [schedule.placements, items, member]);

  if (!member) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text variant="titleMedium">Member not found</Text>
          <Button onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            Go back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Cleanings used this plan year (adult D1110 / child D1120) for the gauge caption.
  const cleaningCode = member.relation === 'child' ? 'D1120' : 'D1110';
  const cleaningsUsed = member.history.filter((h) => h.code === cleaningCode).length;
  const cleaningsLeft = Math.max(0, 2 - cleaningsUsed);
  const deductibleLeft = Math.max(0, plan.deductible - member.deductibleMet);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Gauge + quick facts */}
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.gaugeCard}>
            <Gauge used={member.maxUsed} total={plan.annualMax} size={150} stroke={14} color={color} />
            <Text variant="titleLarge" style={{ fontWeight: '700', marginTop: 8 }}>
              {member.firstName}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {relationLabel(member.relation)} · born {member.birthYear}
            </Text>
            <View style={styles.facts}>
              <Fact label="Left to use" value={money(leftToUse(member.id))} />
              <Fact label="Deductible left" value={money(deductibleLeft)} />
              <Fact label="Cleanings left" value={`${cleaningsLeft} of 2`} />
            </View>
          </Card.Content>
        </Card>

        {/* Next visit */}
        <Card mode="outlined" style={styles.card}>
          <Card.Title title="Next recommended visit" titleVariant="titleMedium" />
          <Card.Content>
            {nextVisit ? (
              <View style={styles.nextVisit}>
                <Chip icon="calendar" compact>
                  {monthLabel(nextVisit.month)}
                </Chip>
                <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
                  You’ll owe about {moneyCents(nextVisit.memberOwes)}. {nextVisit.reason}
                </Text>
              </View>
            ) : (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Nothing to schedule right now.
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Care plan */}
        <Card mode="outlined" style={styles.card}>
          <Card.Title
            title="Care plan"
            titleVariant="titleMedium"
            right={(props) => (
              <Button {...props} compact icon="plus" onPress={() => setAddVisible(true)}>
                Add
              </Button>
            )}
          />
          <Card.Content>
            {items.length === 0 ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                No pending treatment. Add an item to plan ahead.
              </Text>
            ) : (
              items.map((it) => {
                const proc = catalog.get(it.code);
                const placement = schedule.placements.find((p) => p.itemId === it.id);
                return (
                  <View key={it.id} style={styles.planItem}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                        {proc?.plainName ?? it.code}
                        {it.tooth ? ` · tooth ${it.tooth}` : ''}
                      </Text>
                      {placement && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {monthLabel(placement.month)} · you owe {moneyCents(placement.memberOwes)}
                        </Text>
                      )}
                    </View>
                    <Chip
                      compact
                      style={{
                        backgroundColor:
                          it.urgency === 'urgent' ? theme.colors.errorContainer : theme.colors.surfaceVariant,
                      }}
                    >
                      {it.urgency}
                    </Chip>
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* History */}
        <Card mode="outlined" style={styles.card}>
          <Card.Title title="Visit history" titleVariant="titleMedium" />
          <Card.Content>
            {member.history.length === 0 ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                No visits recorded this plan year.
              </Text>
            ) : (
              member.history
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((h, idx) => {
                  const proc = catalog.get(h.code);
                  return (
                    <View key={`${h.code}-${idx}`}>
                      {idx > 0 && <Divider />}
                      <List.Item
                        title={proc?.plainName ?? h.code}
                        description={`${h.date}${h.tooth ? ` · tooth ${h.tooth}` : ''}`}
                        left={(p) => <List.Icon {...p} icon="tooth-outline" />}
                      />
                    </View>
                  );
                })
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="calculator-variant"
          style={styles.estimateBtn}
          onPress={() => sheetRef.current?.snapToIndex(0)}
          accessibilityLabel={`Estimate a visit for ${member.firstName}`}
        >
          Estimate a visit
        </Button>
        <View style={{ height: 24 }} />
      </ScrollView>

      <AddItemDialog
        visible={addVisible}
        onDismiss={() => setAddVisible(false)}
        onAdd={(code, tooth, urgency) => {
          addTreatmentItem({ memberId: member.id, code, tooth, urgency });
          setAddVisible(false);
        }}
      />

      <EstimateSheet ref={sheetRef} memberId={member.id} />
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fact}>
      <Text variant="titleMedium" style={{ fontWeight: '700' }}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function AddItemDialog({
  visible,
  onDismiss,
  onAdd,
}: {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (code: string, tooth: string | undefined, urgency: Urgency) => void;
}) {
  const theme = useTheme();
  const { catalog } = useHousehold();
  const [query, setQuery] = useState('');
  const [code, setCode] = useState<string | undefined>(undefined);
  const [tooth, setTooth] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('flexible');

  const all = useMemo(() => Array.from(catalog.values()), [catalog]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? all.filter(
          (p) =>
            p.code.toLowerCase().includes(q) ||
            p.plainName.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q),
        )
      : all;
    return list.slice(0, 6);
  }, [query, all]);

  const reset = () => {
    setQuery('');
    setCode(undefined);
    setTooth('');
    setUrgency('flexible');
  };

  const selectedProc = code ? catalog.get(code) : undefined;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <Dialog.Title>Add to care plan</Dialog.Title>
        <Dialog.Content>
          {!code ? (
            <>
              <Searchbar
                placeholder="Search procedure or code"
                value={query}
                onChangeText={setQuery}
                style={{ marginBottom: 8 }}
              />
              {results.map((p) => (
                <List.Item
                  key={p.code}
                  title={p.plainName}
                  description={`${p.code} · ${p.tier}`}
                  onPress={() => setCode(p.code)}
                  titleStyle={{ fontWeight: '600' }}
                />
              ))}
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {selectedProc?.plainName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                {code} · {selectedProc?.tier}
              </Text>

              {selectedProc?.frequency?.perTooth && (
                <TextInput
                  mode="outlined"
                  label="Tooth (optional)"
                  value={tooth}
                  onChangeText={setTooth}
                  style={{ marginBottom: 12 }}
                />
              )}

              <Text variant="labelLarge" style={{ marginBottom: 6 }}>
                How urgent is it?
              </Text>
              <SegmentedButtons
                value={urgency}
                onValueChange={(v) => setUrgency(v as Urgency)}
                buttons={[
                  { value: 'flexible', label: 'Flexible', icon: 'calendar-clock' },
                  { value: 'urgent', label: 'Urgent', icon: 'alert' },
                ]}
              />
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => {
              reset();
              onDismiss();
            }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            disabled={!code}
            onPress={() => {
              if (!code) return;
              onAdd(code, tooth.trim() || undefined, urgency);
              reset();
            }}
          >
            Add
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16 },
  card: { marginBottom: 12, borderRadius: 14 },
  gaugeCard: { alignItems: 'center', paddingVertical: 8 },
  facts: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  fact: { alignItems: 'center', flex: 1 },
  nextVisit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  estimateBtn: { marginTop: 4, borderRadius: 12 },
});
