import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { FloatingTabBar } from '@/components';
import { useSession } from '../../src/auth/SessionProvider';

export default function TabsLayout() {
  const router = useRouter();
  const { isLoading, session } = useSession();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, router, session]);

  if (isLoading || !session) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
