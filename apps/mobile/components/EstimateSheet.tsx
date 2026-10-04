// EstimateSheet: a bottom sheet to price a visit for one member.
//
// Search the catalog by plain words or CDT code, tap to add lines, toggle
// in/out-of-network, and see per-line "insurance pays / you owe / why" plus a
// total. Every number comes from the engine via useHousehold().estimateFor —
// the sheet computes nothing itself. The total is labeled an estimate.

import { forwardRef, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Text,
  Searchbar,
  Chip,
  Divider,
  SegmentedButtons,
  List,
  IconButton,
  useTheme,
} from 'react-native-paper';

import { useHousehold } from '../lib/useHousehold';
import { moneyCents } from '../lib/format';
import type { Procedure, LineInput } from '@maxout/engine';

export interface EstimateSheetProps {
  memberId: string;
}

/** Ref type consumers use to open/close the sheet. */
export type EstimateSheetRef = BottomSheet;

export const EstimateSheet = forwardRef<BottomSheet, EstimateSheetProps>(function EstimateSheet(
  { memberId },
  ref,
) {
  const theme = useTheme();
  const { catalog, estimateFor } = useHousehold();

  const [query, setQuery] = useState('');
  const [inNetwork, setInNetwork] = useState(true);
  const [selected, setSelected] = useState<{ code: string; tooth?: string }[]>([]);

  const snapPoints = useMemo(() => ['55%', '90%'], []);
  const allProcedures = useMemo(() => Array.from(catalog.values()), [catalog]);

  const results = useMemo<Procedure[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProcedures.slice(0, 8);
    return allProcedures.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.plainName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q),
    );
  }, [query, allProcedures]);

  const lines: LineInput[] = useMemo(
    () =>
      selected.map((s) => ({
        code: s.code,
        tooth: s.tooth,
        inNetwork,
        date: new Date().toISOString().slice(0, 10),
      })),
    [selected, inNetwork],
  );

  const estimate = useMemo(
    () => (lines.length ? estimateFor(memberId, lines) : undefined),
    [lines, estimateFor, memberId],
  );

  const addLine = (code: string) => setSelected((prev) => [...prev, { code }]);
  const removeLine = (idx: number) => setSelected((prev) => prev.filter((_, i) => i !== idx));

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
    >
      <BottomSheetView style={styles.container}>
        <Text variant="titleLarge" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
          Estimate a visit
        </Text>

        <SegmentedButtons
          style={styles.toggle}
          value={inNetwork ? 'in' : 'out'}
          onValueChange={(v) => setInNetwork(v === 'in')}
          buttons={[
            { value: 'in', label: 'In network', icon: 'check-decagram' },
            { value: 'out', label: 'Out of network', icon: 'map-marker-off' },
          ]}
        />

        <Searchbar
          placeholder="Search 'crown' or a code like D2740"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Selected lines + per-line results */}
          {estimate && (
            <View style={styles.estimateBox}>
              {estimate.lines.map((line, idx) => {
                const proc = catalog.get(line.code);
                return (
                  <View key={`${line.code}-${idx}`} style={styles.lineRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.lineHeader}>
                        <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                          {proc?.plainName ?? line.code}
                        </Text>
                        <IconButton
                          icon="close"
                          size={16}
                          onPress={() => removeLine(idx)}
                          style={styles.removeBtn}
                          accessibilityLabel={`Remove ${proc?.plainName ?? line.code}`}
                        />
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {line.explanation}
                      </Text>
                      {line.warnings.map((w) => (
                        <Text key={w} variant="bodySmall" style={{ color: theme.colors.error }}>
                          {w}
                        </Text>
                      ))}
                      <View style={styles.amounts}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Insurance pays {moneyCents(line.insurerPays)}
                        </Text>
                        <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                          You owe {moneyCents(line.memberOwes)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalRow}>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                  Estimated total you owe
                </Text>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.primary }}>
                  {moneyCents(estimate.total.member)}
                </Text>
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                This is an estimate, not a bill.
              </Text>
            </View>
          )}

          {selected.length === 0 && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Add one or more procedures below to see what the visit will cost.
            </Text>
          )}

          <Divider style={{ marginVertical: 8 }} />
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            {query ? 'Results' : 'Common procedures'}
          </Text>

          {results.map((p) => (
            <List.Item
              key={p.code}
              title={p.plainName}
              description={`${p.code} · ${p.name}`}
              onPress={() => addLine(p.code)}
              right={() => (
                <Chip compact style={{ alignSelf: 'center' }}>
                  Add
                </Chip>
              )}
              titleStyle={{ fontWeight: '600' }}
            />
          ))}
          {results.length === 0 && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              No procedures match “{query}”.
            </Text>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  toggle: { marginTop: 12 },
  search: { marginTop: 12 },
  body: { marginTop: 12 },
  estimateBox: { marginBottom: 8 },
  lineRow: { flexDirection: 'row', marginBottom: 8 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  removeBtn: { margin: 0 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
