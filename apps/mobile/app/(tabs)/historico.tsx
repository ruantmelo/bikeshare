import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoricoRoute() {
  return (
    <SafeAreaView className="flex-1 bg-[#F2F3F0]" edges={['top']}>
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-[20px] font-bold text-[#111]">Histórico</Text>
      </View>
    </SafeAreaView>
  );
}
