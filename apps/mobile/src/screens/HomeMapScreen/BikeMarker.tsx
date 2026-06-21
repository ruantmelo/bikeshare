import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { bikeMarkerColor, BikeRecord } from "./utils";
import { Bike } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface BikeMarkerProps {
  bike: BikeRecord;
  isSelected?: boolean;
  onPress: (bikeId: any) => void;
}

export function BikeMarker({ bike, isSelected = false, onPress }: BikeMarkerProps) {
  const markerColor = bikeMarkerColor(bike.available);

  return (
    <Marker
      key={`${bike.id}-${isSelected ? "selected" : "default"}`}
      coordinate={bike.coordinate}
      zIndex={isSelected ? 10 : 1}
      onPress={() => {
        console.log("[BikeMarker] Pressed bike", bike.id);
        onPress(bike.id);
      }}
      tracksViewChanges
    >
      <View className="items-center justify-center">
        <View
          className={`absolute rounded-full ${isSelected ? "h-[62px] w-[62px]" : "h-[46px] w-[46px]"} ${bike.available ? "bg-brand-primary/18" : "bg-text-muted/15"}`}
        />
        <View
          className={`absolute rounded-full ${isSelected ? "h-[44px] w-[44px]" : "h-[30px] w-[30px]"} ${bike.available ? "bg-brand-primary/28" : "bg-text-muted/20"}`}
        />
        <View
          className={`${isSelected ? "h-[34px] w-[34px] border-[3px] border-white" : "h-[18px] w-[18px]"} items-center justify-center rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.20)]`}
          style={{
            backgroundColor: markerColor,
          }}
        >
          <Bike
            color={colors.text.primary}
            size={isSelected ? 20 : 12}
            strokeWidth={2.8}
          />
        </View>
        {isSelected ? (
          <View
            className="absolute"
            style={[
              styles.pointer,
              {
                borderTopColor: markerColor,
              },
            ]}
          />
        ) : null}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pointer: {
    bottom: -12,
    height: 0,
    width: 0,
    borderLeftColor: "transparent",
    borderLeftWidth: 7,
    borderRightColor: "transparent",
    borderRightWidth: 7,
    borderTopWidth: 10,
  },
});
