import { useRouter } from 'expo-router';
import { useHousehold } from '../../../lib/useHousehold';
import { AccountView } from '../../../components/AccountView';

// Profile tab: show the policyholder's Account (the "self" member, or the first).
export default function ProfileIndex() {
  const router = useRouter();
  const { members } = useHousehold();
  const selfIndex = Math.max(0, members.findIndex((m) => m.relation === 'self'));
  const member = members[selfIndex] ?? members[0];

  if (!member) return null;

  return (
    <AccountView
      member={member}
      memberIndex={selfIndex}
      onOpenCategory={(key) => router.push(`/(tabs)/benefits/${key}`)}
    />
  );
}
