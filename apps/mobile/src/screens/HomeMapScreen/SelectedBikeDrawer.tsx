import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BatteryCharging,
  Hash,
  Lock,
  MapPin,
  Unlock,
  X,
} from "lucide-react-native";

import { Button, IconButton } from "@/components";
import { colors } from "../../theme/colors";
import {
  BIKE_STATUS_LABELS,
  BIKE_STATUS,
  BikeRecord,
  calculateDistanceMeters,
  formatDistance,
} from "./utils";

type SelectedBikeDrawerProps = {
  selectedBike: BikeRecord;
  userLocation: { latitude: number; longitude: number };
  onClose: () => void;
  onRentBike: (bikeId: string) => void;
};

export function SelectedBikeDrawer({
  selectedBike,
  userLocation,
  onClose,
  onRentBike,
}: SelectedBikeDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(320)).current;
  const distance = formatDistance(
    calculateDistanceMeters(userLocation, selectedBike.coordinate),
  );

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [translateY, selectedBike.id]);

  return (
    <Animated.View
      className="absolute inset-x-0 bottom-0 z-30 "
      pointerEvents="box-none"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        transform: [{ translateY }],
      }}
    >
      <View className="rounded-md border border-border-default bg-white px-5 pb-5 pt-3 shadow-[0_-14px_36px_rgba(17,17,17,0.16)]">
        <View className="mt-4 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.6px] text-brand-primary">
              Bike selecionada
            </Text>
            <Text className="mt-1 text-[24px] font-extrabold tracking-[-0.6px] text-text-primary">
              {selectedBike.id}
            </Text>
          </View>

          <IconButton
            onPress={onClose}
            icon={<X color={colors.text.primary} size={16} strokeWidth={2.5} />}
            accessibilityLabel="Fechar detalhes da bike selecionada"
            className="h-10 w-10 bg-control-selected"
          />
        </View>

        <View className="mt-5 flex-row gap-3">
          <InfoPill label="Distância" value={distance} />
          <InfoPill label="Bateria" value={selectedBike.battery} />
          <InfoPill label="Status" value={selectedBike.status} />
        </View>

        {selectedBike.available ? (
          <Button
            onPress={() => onRentBike(selectedBike.id)}
            leftIcon={
              <Unlock color={colors.text.primary} size={18} strokeWidth={2.4} />
            }
            className="mt-5 h-[54px]"
          >
            Alugar esta bicicleta
          </Button>
        ) : (
          <Button disabled className="mt-5 h-[54px]">
            Bicicleta indisponível
          </Button>
        )}
      </View>
    </Animated.View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-background-app px-3 py-3">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.9px] text-text-muted">
        {label}
      </Text>
      <Text
        className="mt-1 text-[14px] font-extrabold text-text-primary"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
