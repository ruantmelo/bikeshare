import { useMemo, useState } from 'react';
import { Pressable, Text, View, type DimensionValue } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bike, BatteryCharging, Hash, Keyboard, LocateFixed, Unlock, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button, IconButton } from '@/components';

import { colors } from '../theme/colors';

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_SAFE_GAP = 18;
const ACTIONS_GAP = 14;
const ACTIONS_BOTTOM_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_SAFE_GAP + ACTIONS_GAP;

type BikeRecord = {
  id: 'BIKE_001' | 'BIKE_002' | 'BIKE_003' | 'BIKE_004';
  distance: string;
  battery: string;
  status: string;
  note: string;
  position: { top: DimensionValue; left: DimensionValue };
  available: boolean;
};

const BIKES: BikeRecord[] = [
  {
    id: 'BIKE_001',
    distance: '120 m',
    battery: '83%',
    status: 'Disponível',
    note: 'Ponto principal',
    position: { top: '9%', left: '14%' },
    available: true,
  },
  {
    id: 'BIKE_002',
    distance: '280 m',
    battery: '64%',
    status: 'Em uso',
    note: 'Próxima ao bloco B',
    position: { top: '6%', left: '60%' },
    available: false,
  },
  {
    id: 'BIKE_003',
    distance: '410 m',
    battery: '91%',
    status: 'Disponível',
    note: 'Área da biblioteca',
    position: { top: '18%', left: '72%' },
    available: true,
  },
  {
    id: 'BIKE_004',
    distance: '190 m',
    battery: '52%',
    status: 'Reservada',
    note: 'Próxima ao pátio',
    position: { top: '29%', left: '40%' },
    available: false,
  },
];

function MapBackdrop() {
  return (
    <View className="absolute inset-0 overflow-hidden rounded-[36px] bg-background-map">
      <View className="absolute left-[-18%] top-[15%] h-[18px] w-[145%] rotate-[-12deg] rounded-full bg-map-road opacity-95" />
      <View className="absolute left-[2%] top-[36%] h-[15px] w-[96%] rotate-[8deg] rounded-full bg-map-road opacity-95" />
      <View className="absolute left-[-8%] top-[57%] h-[18px] w-[118%] rotate-[-4deg] rounded-full bg-map-road opacity-95" />
      <View className="absolute right-[14%] top-[9%] h-[76%] w-[17px] rounded-full bg-map-road opacity-95" />
      <View className="absolute left-[16%] top-[4%] h-[44%] w-[18px] rounded-full bg-map-road opacity-95" />

      <View className="absolute left-[10%] top-[9%] h-[96px] w-[126px] rounded-[18px] bg-map-park" />
      <View className="absolute right-[7%] top-[20%] h-[138px] w-[104px] rounded-[22px] bg-map-parkAlt" />
      <View className="absolute left-[26%] top-[58%] h-[122px] w-[142px] rounded-[26px] bg-map-parkDeep" />
      <View className="absolute right-[20%] top-[55%] h-[84px] w-[92px] rounded-[20px] bg-map-parkSoft" />

      <View className="absolute left-[8%] top-[22%] h-[88px] w-[76px] rounded-[20px] bg-white shadow-[0_8px_18px_rgba(17,17,17,0.08)]" />
      <View className="absolute left-[44%] top-[16%] h-[70px] w-[88px] rounded-[18px] bg-white shadow-[0_8px_18px_rgba(17,17,17,0.08)]" />
      <View className="absolute right-[13%] top-[38%] h-[92px] w-[72px] rounded-[18px] bg-white shadow-[0_8px_18px_rgba(17,17,17,0.08)]" />
      <View className="absolute left-[14%] top-[72%] h-[72px] w-[116px] rounded-[18px] bg-white shadow-[0_8px_18px_rgba(17,17,17,0.08)]" />
      <View className="absolute right-[27%] top-[74%] h-[66px] w-[86px] rounded-[18px] bg-white shadow-[0_8px_18px_rgba(17,17,17,0.08)]" />

      <View className="absolute left-[56%] top-[12%] h-[12px] w-[12px] rounded-full bg-map-tree opacity-80" />
      <View className="absolute left-[62%] top-[15%] h-[10px] w-[10px] rounded-full bg-map-tree opacity-80" />
      <View className="absolute left-[72%] top-[29%] h-[11px] w-[11px] rounded-full bg-map-tree opacity-80" />
      <View className="absolute left-[12%] top-[48%] h-[12px] w-[12px] rounded-full bg-map-tree opacity-80" />
      <View className="absolute left-[20%] top-[86%] h-[12px] w-[12px] rounded-full bg-map-tree opacity-80" />
      <View className="absolute right-[12%] top-[83%] h-[12px] w-[12px] rounded-full bg-map-tree opacity-80" />
    </View>
  );
}

function Marker({ bike, selected, onPress }: { bike: BikeRecord; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute items-center justify-center"
      style={{ top: bike.position.top, left: bike.position.left }}
    >
      <View
        className={`absolute h-[46px] w-[46px] rounded-full bg-brand-primary/18 ${selected ? 'scale-110' : ''}`}
      />
      <View
        className={`absolute h-[30px] w-[30px] rounded-full bg-brand-primary/28 ${selected ? 'scale-110' : ''}`}
      />
      <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-primary shadow-[0_6px_14px_rgba(255,132,0,0.38)]">
        <Bike color={colors.text.primary} size={12} strokeWidth={2.8} />
      </View>
    </Pressable>
  );
}

export default function HomeMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedBikeId, setSelectedBikeId] = useState<BikeRecord['id'] | null>(null);

  const selectedBike = useMemo(
    () => BIKES.find((bike) => bike.id === selectedBikeId) ?? null,
    [selectedBikeId]
  );

  const openInsertId = () => router.push('/insert-id');

  const resetMap = () => setSelectedBikeId(null);

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="flex-1 px-[18px] pt-[18px]">
        <View
          className="absolute left-[18px] top-[18px] z-20 w-[274px] rounded-[24px] border border-border-default bg-white/90 px-4 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.12)]"
        >
          <Text className="text-[30px] font-extrabold tracking-[-1.1px] text-text-primary">
            Olá, Ruan 👋
          </Text>
          <Text className="mt-1 text-[14px] leading-5 text-text-muted">
            Escolha uma bike no mapa
          </Text>
        </View>

        <View className="absolute inset-x-[18px] bottom-[168px] top-[104px] overflow-hidden rounded-[36px] border border-border-map bg-background-map">
          <MapBackdrop />

          {BIKES.map((bike) => (
            <Marker
              key={bike.id}
              bike={bike}
              selected={bike.id === selectedBikeId}
              onPress={() => setSelectedBikeId(bike.id)}
            />
          ))}

          {selectedBike ? (
            <View className="absolute left-[24px] top-[232px] w-[237px] rounded-[22px] border border-border-default bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(17,17,17,0.12)]">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[18px] font-extrabold tracking-[-0.4px] text-text-primary">
                    {selectedBike.id}
                  </Text>
                  <Text className="mt-1 text-[13px] text-text-muted">{selectedBike.note}</Text>
                </View>
                <IconButton
                  onPress={resetMap}
                  icon={<X color={colors.text.primary} size={14} strokeWidth={2.4} />}
                  accessibilityLabel="Fechar detalhes da bike"
                  className="h-8 w-8 bg-control-selected"
                />
              </View>

              <View className="mt-4 gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-control-iconTint">
                    <Hash color={colors.brand.primary} size={17} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">Distância</Text>
                    <Text className="text-[15px] font-bold text-text-primary">{selectedBike.distance}</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-control-iconTint">
                    <BatteryCharging color={colors.brand.primary} size={17} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">Bateria</Text>
                    <Text className="text-[15px] font-bold text-text-primary">{selectedBike.battery}</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-control-iconTint">
                    {selectedBike.available ? (
                      <Unlock color={colors.brand.primary} size={17} strokeWidth={2.4} />
                    ) : (
                      <X color={colors.brand.primary} size={17} strokeWidth={2.4} />
                    )}
                  </View>
                  <View>
                    <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">Situação</Text>
                    <Text className="text-[15px] font-bold text-text-primary">{selectedBike.status}</Text>
                  </View>
                </View>
              </View>

              <Button
                onPress={openInsertId}
                leftIcon={<Unlock color={colors.text.primary} size={17} strokeWidth={2.4} />}
                className="mt-4 h-[48px]"
              >
                Alugar esta bike
              </Button>
            </View>
          ) : null}
        </View>

        <View
          className="absolute left-[18px] right-[18px] z-20 flex-row items-center gap-3"
          style={{ bottom: insets.bottom + ACTIONS_BOTTOM_OFFSET }}
        >
          <Button
            onPress={openInsertId}
            leftIcon={<Keyboard color={colors.text.primary} size={18} strokeWidth={2.4} />}
            className="flex-1 shadow-[0_10px_24px_rgba(255,132,0,0.24)]"
          >
            Inserir ID
          </Button>

          <IconButton
            onPress={resetMap}
            icon={<LocateFixed color={colors.text.primary} size={18} strokeWidth={2.4} />}
            accessibilityLabel="Centralizar mapa"
            className="w-[56px] shadow-[0_10px_24px_rgba(17,17,17,0.10)]"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
