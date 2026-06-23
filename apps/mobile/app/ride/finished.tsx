import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, Clock3, MapPinned, Bike } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';

import { formatDuration, useRideFlow } from '../../src/rides';
import { colors } from '../../src/theme/colors';

export default function FinishedRideRoute() {
  const router = useRouter();
  const { endedRide, clearRideFlow } = useRideFlow();

  const totalTimeLabel = useMemo(() => {
    if (!endedRide) return null;

    const startedAt = new Date(endedRide.startedAt).getTime();
    const endedAt = endedRide.endedAt ? new Date(endedRide.endedAt).getTime() : Date.now();
    return formatDuration(Math.floor((endedAt - startedAt) / 1000));
  }, [endedRide]);

  const handleBackToHome = () => {
    clearRideFlow();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-1 justify-between px-6 pb-6 pt-4">
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-[32px] font-extrabold tracking-[-1px] text-text-primary">
              {endedRide ? 'Corrida finalizada' : 'Nenhuma corrida finalizada agora'}
            </Text>
            <Text className="text-[15px] leading-6 text-text-muted">
              {endedRide
                ? 'Tudo certo. A corrida foi encerrada e registrada no sistema.'
                : 'Volte ao início para começar uma nova corrida quando quiser.'}
            </Text>
          </View>

          <View className="rounded-[30px] border border-border-default bg-white p-5 shadow-[0_18px_40px_rgba(17,17,17,0.12)]">
            <View className="flex-row items-start gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                <CheckCircle2 color={colors.brand.primary} size={28} strokeWidth={2.2} />
              </View>

              <View className="flex-1 gap-1">
                <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
                  {endedRide ? 'Encerramento confirmado' : 'Estado vazio'}
                </Text>
                <Text className="text-[17px] font-semibold tracking-[-0.4px] text-text-primary">
                  {endedRide
                    ? 'A corrida foi encerrada com sucesso.'
                    : 'Nenhuma corrida finalizada está disponível agora.'}
                </Text>
                <Text className="text-[13px] leading-5 text-text-muted">
                  {endedRide
                    ? 'Você pode conferir os detalhes abaixo antes de voltar ao início.'
                    : 'Se você acabou de finalizar, aguarde a tela ser atualizada.'}
                </Text>
              </View>
            </View>
          </View>

          {endedRide ? (
            <View className="gap-3 rounded-[26px] border border-border-default bg-white p-4">
              <SummaryRow
                icon={<Clock3 color={colors.brand.primary} size={18} strokeWidth={2.3} />}
                label="Tempo total"
                value={totalTimeLabel ?? '—'}
              />
              <SummaryRow
                icon={<MapPinned color={colors.brand.primary} size={18} strokeWidth={2.3} />}
                label="Distância"
                value="Não registrada"
              />
              <SummaryRow
                icon={<Bike color={colors.brand.primary} size={18} strokeWidth={2.3} />}
                label="Bicicleta"
                value={endedRide.bicycleId}
              />
            </View>
          ) : null}
        </View>

        <View className="pt-4">
          <Button onPress={handleBackToHome}>Voltar ao início</Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-[20px] bg-background-app px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-text-muted">
          {label}
        </Text>
        <Text className="mt-1 text-[15px] font-semibold tracking-[-0.3px] text-text-primary">
          {value}
        </Text>
      </View>
    </View>
  );
}
