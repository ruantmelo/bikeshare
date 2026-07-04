import { useEffect, useState, type ReactNode } from 'react';
import type { BicycleStatus } from '@bikeshare/contracts';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bike, CircleDot, Clock3, MapPinned } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';

import { formatDuration, useActiveRideQuery, useEndRideMutation } from '../../src/rides';
import { colors } from '../../src/theme/colors';

const BICYCLE_STATUS_LABELS: Record<BicycleStatus, string> = {
  UNREGISTERED: 'Não registrada',
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservada',
  IN_USE: 'Em uso',
  ERROR: 'Com problema',
};

const BICYCLE_STATUS_COLORS: Record<BicycleStatus, string> = {
  UNREGISTERED: colors.text.muted,
  AVAILABLE: colors.status.success,
  RESERVED: colors.text.warning,
  IN_USE: colors.brand.primary,
  ERROR: colors.text.error,
};

function formatRideTimeLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function CurrentRideRoute() {
  const router = useRouter();
  const activeRideQuery = useActiveRideQuery();
  const endRideMutation = useEndRideMutation();
  const [now, setNow] = useState(() => Date.now());
  const [isLeavingForFinished, setIsLeavingForFinished] = useState(false);

  const ride = activeRideQuery.data ?? null;

  useEffect(() => {
    if (!activeRideQuery.isFetched) return;
    if (isLeavingForFinished) return;
    if (!ride) {
      router.replace('/(tabs)');
    }
  }, [activeRideQuery.isFetched, isLeavingForFinished, ride, router]);

  useEffect(() => {
    if (!ride) return;

    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [ride?.reservedAt, ride?.startedAt, ride?.status]);

  const isReservedRide = ride?.status === 'RESERVED';
  const rideTimeAnchor = ride
    ? isReservedRide
      ? ride.reservedAt
      : ride.startedAt ?? ride.reservedAt
    : null;
  const rideTimeAnchorMs = rideTimeAnchor ? new Date(rideTimeAnchor).getTime() : 0;
  const elapsedSeconds = rideTimeAnchor ? Math.floor((now - rideTimeAnchorMs) / 1000) : 0;
  const timerLabel = formatDuration(elapsedSeconds);
  const rideTimeLabel = rideTimeAnchor ? formatRideTimeLabel(rideTimeAnchor) : '--:--';
  const statusLabel = isReservedRide ? 'Reserva pendente' : 'Corrida em andamento';
  const timerTitle = isReservedRide ? 'Tempo reservado' : 'Tempo decorrido';
  const timeMetricLabel = isReservedRide ? 'Reserva' : 'Início';
  const bicycleTimingLabel = isReservedRide ? 'Reservada às' : 'Iniciada às';
  const bicycleStatus = ride?.bicycle.status ?? null;
  const bicycleStatusLabel = bicycleStatus ? BICYCLE_STATUS_LABELS[bicycleStatus] : '--';
  const bicycleStatusColor = bicycleStatus ? BICYCLE_STATUS_COLORS[bicycleStatus] : colors.text.muted;
  const refreshLabel = activeRideQuery.isFetching ? 'Atualizando...' : 'Status atualizado';
  const errorMessage = endRideMutation.error?.message ?? null;

  if (activeRideQuery.isFetched && !ride) {
    return null;
  }

  const handleFinishRide = async () => {
    endRideMutation.reset();
    setIsLeavingForFinished(true);

    try {
      await endRideMutation.mutateAsync();
      router.replace('/ride/finished');
    } catch {
      setIsLeavingForFinished(false);
      // Error message is rendered from the mutation state.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View className="flex-1 overflow-hidden bg-background-map">
        <RideBackdrop />

        <View className="flex-1 justify-between px-6 pb-3 pt-4">
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="rounded-full border border-border-default bg-white/90 px-4 py-2">
                <Text className="text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
                  {statusLabel}
                </Text>
              </View>

              <Text className="text-[12px] font-semibold text-text-muted">
                {refreshLabel}
              </Text>
            </View>

            <View className="rounded-[30px] border border-border-default bg-white/95 p-5 shadow-[0_18px_40px_rgba(17,17,17,0.12)]">
              <View className="flex-row items-start gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                  <Clock3 color={colors.brand.primary} size={24} strokeWidth={2.3} />
                </View>

                <View className="flex-1 gap-1">
                  <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
                    {timerTitle}
                  </Text>
                  <Text className="text-[40px] font-extrabold tracking-[-1.8px] text-text-primary">
                    {activeRideQuery.isLoading && !ride ? '00:00' : timerLabel}
                  </Text>
                  <Text className="text-[14px] leading-5 text-text-muted">
                    Bicicleta {ride?.bicycleId ?? '—'} · {bicycleTimingLabel} {rideTimeLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <MetricCard
                icon={<Bike color={colors.brand.primary} size={18} strokeWidth={2.3} />}
                label="Bicicleta"
                value={ride?.bicycleId ?? '—'}
              />
              <MetricCard
                icon={<CircleDot color={bicycleStatusColor} size={18} strokeWidth={2.3} />}
                label="Status"
                value={bicycleStatusLabel}
                valueColor={bicycleStatusColor}
              />
            </View>

            <View className="flex-row gap-3">
              <MetricCard
                icon={<MapPinned color={colors.brand.primary} size={18} strokeWidth={2.3} />}
                label={timeMetricLabel}
                value={rideTimeLabel}
              />
            </View>

            {errorMessage ? (
              <Text className="px-1 text-[13px] leading-5 text-text-danger">{errorMessage}</Text>
            ) : null}
          </View>

          <View className="gap-3 pt-4">
            <Button
              disabled={!ride || endRideMutation.isPending}
              onPress={() => void handleFinishRide()}
            >
              Finalizar corrida
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RideBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <View className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-brand-primary/10" />
      <View className="absolute -right-20 top-28 h-64 w-64 rounded-full bg-white/45" />
      <View className="absolute left-5 right-5 top-28 h-[2px] -rotate-[10deg] rounded-full bg-border-map/80" />
      <View className="absolute left-10 right-10 top-44 h-[2px] rotate-[14deg] rounded-full bg-border-map/70" />
      <View className="absolute left-0 right-0 top-36 h-[2px] bg-white/60" />

      <View className="absolute left-14 top-20 h-5 w-5 rounded-full border-4 border-brand-primary bg-white" />
      <View className="absolute bottom-28 right-16 h-6 w-6 rounded-full border-4 border-brand-primary bg-white" />

      <View className="absolute bottom-14 left-6 h-20 w-20 rounded-[28px] bg-map-park/70" />
      <View className="absolute bottom-24 left-24 h-28 w-44 rounded-[34px] bg-map-parkAlt/75" />
      <View className="absolute right-0 top-1/2 h-40 w-28 rounded-l-[40px] bg-white/50" />
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-1 rounded-[22px] border border-border-default bg-white/90 p-4">
      <View className="mb-3 h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10">
        {icon}
      </View>
      <Text className="font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-text-muted">
        {label}
      </Text>
      <Text
        className="mt-1 text-[16px] font-bold tracking-[-0.4px] text-text-primary"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
