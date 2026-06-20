import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

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
          <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-[#666]">
            {displayLabel}
          </Text>

          <View className="rounded-[16px] border border-[#CBCCC9] bg-white">
            <TextInput
              className="h-[50px] px-4 text-[15px] text-[#111]"
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              keyboardType={keyboardType}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor="#9A9B97"
              secureTextEntry={secureTextEntry}
              selectionColor="#FF8400"
              textAlignVertical="center"
              value={(value as string) ?? ''}
            />
          </View>

          {error?.message ? (
            <Text className="text-[12px] text-[#B45309]">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
