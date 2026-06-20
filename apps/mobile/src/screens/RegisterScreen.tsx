import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Check, ArrowLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button, InputField } from '@/components';
import { apiRequest } from '../api/client';
import { useSession } from '../auth/SessionProvider';
import type { AuthResponse } from '../auth/types';
import { colors } from '../theme/colors';

type RegisterFormValues = {
  email: string;
  password: string;
};

type RegisterScreenProps = {
  onBackToLogin?: () => void;
};

export function RegisterScreen({ onBackToLogin }: RegisterScreenProps) {
  const router = useRouter();
  const { setSession, session, isLoading } = useSession();
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues): Promise<AuthResponse> => {
      return apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
    onSuccess: async (data) => {
      await setSession(data);
      router.replace('/(tabs)');
    },
  });

  const onSubmit = handleSubmit((values: RegisterFormValues) => {
    registerMutation.mutate(values);
  });

  const handleBackToLogin = onBackToLogin ?? (() => router.replace('/(auth)/login'));

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, session]);

  const errorMessage = registerMutation.error?.message ?? null;

  if (isLoading || session) return null;

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <StatusBar style="dark" />

      <View className="flex-1 gap-[22px] px-[18px] py-4">
        <View className="gap-2">
          <Text className="text-[28px] font-extrabold tracking-[-0.9px] text-text-primary">
            Cadastro de usuário
          </Text>
          <Text className="text-[14px] leading-5 text-text-muted">
            Informe seu email e senha para fazer o cadastro.
          </Text>
        </View>

        {errorMessage ? <Text className="text-sm text-text-danger">{errorMessage}</Text> : null}

        <View className="gap-[14px] rounded-[16px] border border-border-default bg-white p-4">
          <InputField
            control={control}
            name="email"
            label="Email"
            placeholder="aluno@ufal.br"
            keyboardType="email-address"
            autoCapitalize="none"
            rules={{
              required: 'Informe seu e-mail.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Digite um e-mail válido.',
              },
            }}
          />

          <InputField
            control={control}
            name="password"
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            rules={{
              required: 'Informe sua senha.',
              minLength: { value: 6, message: 'Use pelo menos 6 caracteres.' },
            }}
          />

          <View className="gap-3 pt-1">
            <Button
              onPress={onSubmit}
              disabled={registerMutation.isPending}
              rightIcon={<Check color={colors.text.primary} size={18} strokeWidth={2.8} />}
            >
              Cadastrar
            </Button>

            <Button
              variant="secondary"
              onPress={handleBackToLogin}
              leftIcon={<ArrowLeft color={colors.text.primary} size={18} strokeWidth={2.8} />}
            >
              Voltar
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
