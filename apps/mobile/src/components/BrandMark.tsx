import { Bike } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '../theme/colors';

export function BrandMark() {
  return (
    <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-brand-primary">
      <Bike color={colors.text.primary} size={30} strokeWidth={2.4} />
    </View>
  );
}
