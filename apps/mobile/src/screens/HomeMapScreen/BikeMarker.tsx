import { View } from "react-native";
import { Marker } from "react-native-maps";
import { bikeMarkerColor, BikeRecord } from "./utils";
import { Bike } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface BikeMarkerProps {
  bike: BikeRecord;
  onPress: (bikeId: any) => void;
}

export function BikeMarker({ bike, onPress }: BikeMarkerProps) {
  return (
    <Marker
      key={bike.id}
      coordinate={bike.coordinate}
      onPress={() => {
        console.log("[BikeMarker] Pressed bike", bike.id);
        onPress(bike.id);
      }}
      tracksViewChanges={false}
    >
      <View className="items-center justify-center">
        <View
          className={`absolute h-[46px] w-[46px] rounded-full ${bike.available ? "bg-brand-primary/18" : "bg-text-muted/15"}`}
        />
        <View
          className={`absolute h-[30px] w-[30px] rounded-full ${bike.available ? "bg-brand-primary/28" : "bg-text-muted/20"}`}
        />
        <View
          className="h-[18px] w-[18px] items-center justify-center rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.20)]"
          style={{
            backgroundColor: bikeMarkerColor(bike.available),
          }}
        >
          <Bike color={colors.text.primary} size={12} strokeWidth={2.8} />
        </View>
      </View>
    </Marker>
  );
}
