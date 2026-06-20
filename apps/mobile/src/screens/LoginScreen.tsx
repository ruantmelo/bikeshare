import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { BrandMark, Button, InputField } from '@/components';
import { colors } from '../theme/colors';

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginScreenProps = {
  onCreateAccount?: () => void;
};

export function LoginScreen({ onCreateAccount }: LoginScreenProps) {
  const { control, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues): Promise<LoginFormValues> => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return values;
    },
    onSuccess: () => {
      Alert.alert('Login', 'Acesso enviado com sucesso.');
    },
    onError: () => {
      Alert.alert('Login', 'Não foi possível entrar agora.');
    },
  });

  const onSubmit = handleSubmit((values: LoginFormValues) => {
    loginMutation.mutate(values);
  });

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <StatusBar style="dark" />

      <View className="flex-1 gap-[22px] px-[18px] py-4">
        <View className="gap-4">
          <BrandMark />

          <View className="gap-2">
            <Text className="text-[32px] font-extrabold tracking-[-1px] text-text-primary">
              BikeShare UFAL
            </Text>
            <Text className="text-[15px] leading-6 text-text-muted">
              Acesse para alugar bicicletas conectadas ao sistema embarcado.
            </Text>
          </View>
        </View>

        <View className="gap-4 rounded-[16px] border border-border-default bg-white p-4">
          <InputField
            control={control}
            name="email"
            label="Email"
            placeholder="aluno@ufal.br"
            keyboardType="email-address"
            autoCapitalize="none"
            rules={{
              required: 'Informe seu e-mail institucional.',
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
              disabled={loginMutation.isPending}
              rightIcon={<ArrowRight color={colors.text.primary} size={18} strokeWidth={2.8} />}
            >
              Entrar
            </Button>

            <Button variant="secondary" onPress={onCreateAccount}>
              Criar conta
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
