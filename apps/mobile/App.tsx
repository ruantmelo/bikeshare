import { StatusBar } from "expo-status-bar";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-slate-950 px-6">
      <Text className="text-center text-2xl font-bold text-white">
        NativeWind is ready
      </Text>
      <Text className="text-center text-base text-slate-300">
        This button is styled with Tailwind classes from a component imported
        via @/components.
      </Text>
      <Button onPress={() => Alert.alert("NativeWind", "The button works!")}>
        Press me
      </Button>
      <StatusBar style="auto" />
    </View>
  );
}
