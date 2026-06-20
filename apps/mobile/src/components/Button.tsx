import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = ComponentProps<typeof Pressable> & {
  children: ReactNode;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#FF8400] active:opacity-90',
  secondary: 'bg-[#E7E8E5] active:opacity-85',
};

export function Button({
  children,
  variant = 'primary',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`h-[52px] w-full flex-row items-center justify-center gap-3 rounded-full px-5 ${variantClasses[variant]} disabled:opacity-50 ${className}`}
      {...props}
    >
      {leftIcon ? <View className="items-center justify-center">{leftIcon}</View> : null}
      <Text className="text-[15px] font-bold text-[#111]">{children}</Text>
      {rightIcon ? <View className="items-center justify-center">{rightIcon}</View> : null}
    </Pressable>
  );
}
