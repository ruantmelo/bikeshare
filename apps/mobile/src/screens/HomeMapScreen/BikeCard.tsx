import {
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BIKE_STATUS_LABELS, BikeRecord, calculateDistanceMeters, formatDistance } from "./utils";
import { Button, IconButton } from "@/components";
import { BatteryCharging, Hash, Unlock, X } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface BikeCardProps {
  selectedBike: BikeRecord;
  userLocation: { latitude: number; longitude: number };
  onClose: () => void;
  onRentBike: (bikeId: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
}

export function BikeCard({
  selectedBike,
  userLocation,
  onClose,
  onRentBike,
  onLayout,
  style,
}: BikeCardProps) {
  console.log("[BikeCard] Rendering bike card for bike", selectedBike.id);
  return (
    <View
      onLayout={onLayout}
      className="absolute z-10 w-[237px] rounded-[22px] border border-border-default bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(17,17,17,0.12)]"
      style={style}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[18px] font-extrabold tracking-[-0.4px] text-text-primary">
            {selectedBike.id}
          </Text>
          <Text className="mt-1 text-[13px] text-text-muted">
            {selectedBike.note}
          </Text>
        </View>
        <IconButton
          onPress={onClose}
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
            <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">
              Distância
            </Text>
            <Text className="text-[15px] font-bold text-text-primary">
              {formatDistance(
                calculateDistanceMeters(userLocation, selectedBike.coordinate),
              )}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-control-iconTint">
            <BatteryCharging
              color={colors.brand.primary}
              size={17}
              strokeWidth={2.4}
            />
          </View>
          <View>
            <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">
              Bateria
            </Text>
            <Text className="text-[15px] font-bold text-text-primary">
              {selectedBike.battery}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-control-iconTint">
            {selectedBike.available ? (
              <Unlock
                color={colors.brand.primary}
                size={17}
                strokeWidth={2.4}
              />
            ) : (
              <X color={colors.brand.primary} size={17} strokeWidth={2.4} />
            )}
          </View>
          <View>
            <Text className="text-[11px] uppercase tracking-[1px] text-text-muted">
              Situação
            </Text>
            <Text className="text-[15px] font-bold text-text-primary">
              {BIKE_STATUS_LABELS[selectedBike.status]}
            </Text>
          </View>
        </View>
      </View>

      {selectedBike.available ? (
        <Button
          onPress={() => onRentBike(selectedBike.id)}
          leftIcon={
            <Unlock color={colors.text.primary} size={17} strokeWidth={2.4} />
          }
          className="mt-4 h-[48px]"
        >
          Alugar esta bicicleta
        </Button>
      ) : (
        <Button disabled className="mt-4 h-[48px]">
          Bicicleta indisponível
        </Button>
      )}
    </View>
  );
}
