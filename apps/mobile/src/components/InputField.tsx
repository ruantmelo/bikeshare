import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';

type InputFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
};

export function InputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  rules,
}: InputFieldProps<TFieldValues>) {
  const displayLabel = label.toUpperCase();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="gap-2">
          <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
            {displayLabel}
          </Text>

          <View className="rounded-[16px] border border-border-default bg-white">
            <TextInput
              className="h-[50px] px-4 text-[15px] text-text-primary"
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              keyboardType={keyboardType}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={colors.text.placeholder}
              secureTextEntry={secureTextEntry}
              selectionColor={colors.brand.primary}
              textAlignVertical="center"
              value={(value as string) ?? ''}
            />
          </View>

          {error?.message ? (
            <Text className="text-[12px] text-text-danger">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
