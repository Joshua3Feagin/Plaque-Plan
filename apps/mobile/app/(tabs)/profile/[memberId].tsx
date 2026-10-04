import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useHousehold } from '../../../lib/useHousehold';
import { AccountView } from '../../../components/AccountView';

// Per-member Account screen (from Home member tap or "See all").
export default function MemberAccount() {
  const router = useRouter();
  const navigation = useNavigation();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { members } = useHousehold();

  const memberIndex = members.findIndex((m) => m.id === memberId);
  const member = members[memberIndex];
  if (!member) return null;

  return (
    <AccountView
      member={member}
      memberIndex={memberIndex < 0 ? 0 : memberIndex}
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : router.push('/(tabs)/home'))}
      onOpenCategory={(key) => router.push(`/(tabs)/benefits/${key}`)}
    />
  );
}
