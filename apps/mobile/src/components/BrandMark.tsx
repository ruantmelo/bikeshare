import { Bike } from 'lucide-react-native';
import { View } from 'react-native';

export function BrandMark() {
  return (
    <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-[#FF8400]">
      <Bike color="#111111" size={30} strokeWidth={2.4} />
    </View>
  );
}
