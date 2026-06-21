import { Button, IconButton } from "@/components";
import { Keyboard, LocateFixed } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "../../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACTIONS_BOTTOM_OFFSET } from "./utils";

interface ActionButtonsProps {
  onInsertIdPress: () => void;
  onUserCenterPress: () => void;
}

export function ActionButtons({
  onInsertIdPress,
  onUserCenterPress,
}: ActionButtonsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-[18px] right-[18px] z-20 flex-row items-center gap-3"
      style={{ bottom: insets.bottom + ACTIONS_BOTTOM_OFFSET }}
    >
      <Button
        onPress={onInsertIdPress}
        leftIcon={
          <Keyboard color={colors.text.primary} size={18} strokeWidth={2.4} />
        }
        className="flex-1 shadow-[0_10px_24px_rgba(255,132,0,0.24)]"
      >
        Inserir ID
      </Button>

      <IconButton
        onPress={onUserCenterPress}
        icon={
          <LocateFixed
            color={colors.text.primary}
            size={18}
            strokeWidth={2.4}
          />
        }
        accessibilityLabel="Centralizar mapa"
        className="w-[56px] shadow-[0_10px_24px_rgba(17,17,17,0.10)]"
      />
    </View>
  );
}
