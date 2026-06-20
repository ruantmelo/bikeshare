import { Redirect } from 'expo-router';

import { useSession } from '../src/auth/SessionProvider';

export default function IndexRoute() {
  const { session } = useSession();

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
