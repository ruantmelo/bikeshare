import type { ComponentProps, ReactNode } from 'react';
import { Pressable } from 'react-native';

type IconButtonVariant = 'primary' | 'secondary' | 'surface';

type IconButtonProps = ComponentProps<typeof Pressable> & {
  icon: ReactNode;
  variant?: IconButtonVariant;
};

const variantClasses: Record<IconButtonVariant, string> = {
  primary: 'bg-brand-primary active:opacity-90',
  secondary: 'bg-control-secondary active:opacity-85',
  surface: 'border border-border-default bg-white active:opacity-85',
};

export function IconButton({ icon, variant = 'surface', className = '', ...props }: IconButtonProps) {
  return (
    <Pressable
      className={`h-[52px] w-[52px] items-center justify-center rounded-full ${variantClasses[variant]} disabled:opacity-50 ${className}`}
      {...props}
    >
      {icon}
    </Pressable>
  );
}
