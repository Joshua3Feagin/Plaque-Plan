// AccountView: the per-member Account screen body (account_screen.png).
// Shared by the Profile tab (policyholder) and the dynamic [memberId] route.

import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useHousehold, type Member } from '../lib/useHousehold';
import { money } from '../lib/format';
import { accountRelationLabel, idCardFor } from '../lib/account';
import { COVERAGE_CATEGORIES } from '../lib/benefits';
import { memberColor, brand } from '../theme/colors';
import { MaroonHeaderCard, SectionHeading, AvatarBadge, CoverageRow } from './ui/primitives';

export function AccountView({
  member,
  memberIndex,
  onBack,
  onOpenCategory,
}: {
  member: Member;
  memberIndex: number;
  onBack?: () => void;
  onOpenCategory?: (key: string) => void;
}) {
  const theme = useTheme();
  const { plan, leftToUse, household } = useHousehold();

  const left = leftToUse(member.id);
  const used = Math.max(0, plan.annualMax - left);
  const usedFraction = plan.annualMax > 0 ? Math.min(1, used / plan.annualMax) : 0;
  const color = memberColor(memberIndex);

  // Last name from household name (demo). Group # is a stable demo value.
  const idCard = idCardFor(member, plan.name, household.name, 'STAMARYCOL');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top bar with back + title */}
        <View style={styles.topBar}>
          {onBack ? (
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={theme.colors.primary}
              onPress={onBack}
              accessibilityLabel="Go back"
            />
          ) : (
            <View style={{ width: 28 }} />
          )}
          <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
            Account
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Account header card */}
        <MaroonHeaderCard>
          <View style={styles.acctRow}>
            <AvatarBadge name={member.firstName} color="rgba(255,255,255,0.18)" size={56} />
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.kicker}>
                ACCOUNT
              </Text>
              <Text variant="headlineSmall" style={styles.acctName}>
                {member.firstName}
              </Text>
              <Text variant="bodyMedium" style={styles.acctSub}>
                {accountRelationLabel(member.relation)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text variant="bodyMedium" style={styles.acctSub}>
            {plan.name}
          </Text>
        </MaroonHeaderCard>

        {/* Plan usage */}
        <SectionHeading>Plan usage</SectionHeading>
        <View style={[styles.card, { borderColor: theme.colors.outline }]}>
          <View style={styles.usageRow}>
            <Stat value={money(plan.deductible)} label="Deductible" />
            <Divider />
            <Stat value={money(plan.annualMax)} label="Annual max" />
            <Divider />
            <Stat value={money(used)} label="Used so far" />
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${usedFraction * 100}%`, backgroundColor: brand.accent }]} />
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {money(left)} remaining this plan year
          </Text>
        </View>

        {/* ID card */}
        <SectionHeading>ID card</SectionHeading>
        <View style={styles.idCard}>
          <Text variant="labelMedium" style={styles.idKicker}>
            {plan.name.toUpperCase()}
          </Text>
          <Text variant="bodySmall" style={styles.idFaint}>
            Member ID Card
          </Text>
          <Text variant="titleLarge" style={styles.idName}>
            {idCard.memberName}
          </Text>
          <Text variant="bodyMedium" style={styles.idFaint}>
            {idCard.relationLabel}
          </Text>
          <View style={styles.idGrid}>
            <View>
              <Text variant="labelSmall" style={styles.idFaint}>
                MEMBER ID
              </Text>
              <Text variant="titleMedium" style={styles.idValue}>
                {idCard.memberId}
              </Text>
            </View>
            <View>
              <Text variant="labelSmall" style={styles.idFaint}>
                GROUP #
              </Text>
              <Text variant="titleMedium" style={styles.idValue}>
                {idCard.groupNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Coverage breakdown */}
        <SectionHeading>Coverage breakdown</SectionHeading>
        <View style={[styles.card, { borderColor: theme.colors.outline, paddingVertical: 0 }]}>
          {COVERAGE_CATEGORIES.map((c, i) => (
            <CoverageRow
              key={c.key}
              label={c.name}
              percent={c.coverage}
              last={i === COVERAGE_CATEGORIES.length - 1}
              onPress={onOpenCategory ? () => onOpenCategory(c.key) : undefined}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text variant="titleLarge" style={{ fontWeight: '800', color: theme.colors.primary }}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.vdivider, { backgroundColor: theme.colors.outline }]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  acctRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  acctName: { color: '#FFFFFF', fontWeight: '800' },
  acctSub: { color: 'rgba(255,255,255,0.85)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 4 },
  usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'flex-start' },
  vdivider: { width: 1, height: 36, marginHorizontal: 8 },
  track: { height: 8, borderRadius: 4, backgroundColor: brand.surfaceVariant, marginTop: 16, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  idCard: { backgroundColor: '#3A0020', borderRadius: 18, padding: 18, marginTop: 4 },
  idKicker: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1 },
  idFaint: { color: 'rgba(255,255,255,0.7)' },
  idName: { color: '#FFFFFF', fontWeight: '800', marginTop: 10 },
  idValue: { color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  idGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingRight: 40 },
});
