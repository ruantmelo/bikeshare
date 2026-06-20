import { History, House, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

const TAB_META = {
  index: {
    label: 'Início',
    icon: House,
  },
  historico: {
    label: 'Histórico',
    icon: History,
  },
  perfil: {
    label: 'Perfil',
    icon: User,
  },
} as const;

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string } }>;
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="h-[64px] w-full flex-row items-center border-t border-border-default bg-white/90 px-[18px] shadow-[0_-10px_28px_rgba(17,17,17,0.12)]">
        {state.routes.map((route, index) => {
          const { label, icon: Icon } = TAB_META[route.name as keyof typeof TAB_META];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center"
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? label}
            >
              <View
                className={`h-10 flex-row items-center justify-center gap-2 rounded-full px-4 ${isFocused ? 'bg-control-selected' : ''}`}
              >
                <Icon
                  size={18}
                  strokeWidth={2.4}
                  color={isFocused ? colors.brand.primary : colors.text.primary}
                />
                <Text
                  className={`text-[12px] font-semibold ${isFocused ? 'text-text-primary' : 'text-text-muted'}`}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
