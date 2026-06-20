import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useSession } from '../../src/auth/SessionProvider';

export default function PerfilRoute() {
  const router = useRouter();
  const { logout } = useSession();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={['top']}>
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-[20px] font-bold text-text-primary">Perfil</Text>
        <Button variant="secondary" onPress={handleLogout}>
          Sair
        </Button>
      </View>
    </SafeAreaView>
  );
}
