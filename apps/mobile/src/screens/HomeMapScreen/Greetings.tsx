import { Text, View } from "react-native";

export function GreetingsCard({ name }: { name: string }) {
  return (
    <View className="absolute left-[18px] top-[18px] z-20 w-[274px] rounded-[24px] border border-border-default bg-white/90 px-4 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.12)]">
      <Text className="text-[30px] font-extrabold tracking-[-1.1px] text-text-primary">
        Olá, {name} 👋
      </Text>
      <Text className="mt-1 text-[14px] leading-5 text-text-muted">
        Escolha uma bicicleta no mapa
      </Text>
    </View>
  );
}
