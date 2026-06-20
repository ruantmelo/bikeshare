import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

type ButtonProps = ComponentProps<typeof Pressable> & {
  children: ReactNode;
};

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <Pressable
      className={`rounded-full bg-indigo-600 px-6 py-3 active:bg-indigo-700 ${className}`}
      {...props}
    >
      <Text className="text-center text-base font-semibold text-white">
        {children}
      </Text>
    </Pressable>
  );
}
