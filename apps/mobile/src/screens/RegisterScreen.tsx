import { StatusBar } from 'expo-status-bar';
import { Check, ArrowLeft } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button, InputField } from '@/components';
import { colors } from '../theme/colors';

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

type RegisterScreenProps = {
  onBackToLogin?: () => void;
};

export function RegisterScreen({ onBackToLogin }: RegisterScreenProps) {
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    defaultValues: { name: '', email: '', password: '', phone: '' },
    mode: 'onSubmit',
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues): Promise<RegisterFormValues> => {
      await new Promise((resolve) => setTimeout(resolve, 950));
      return values;
    },
    onSuccess: () => {
      Alert.alert('Cadastro', 'Conta criada com sucesso.');
    },
    onError: () => {
      Alert.alert('Cadastro', 'Não foi possível concluir o cadastro.');
    },
  });

  const onSubmit = handleSubmit((values: RegisterFormValues) => {
    registerMutation.mutate(values);
  });

  return (
    <SafeAreaView className="flex-1 bg-background-app">
      <StatusBar style="dark" />

      <View className="flex-1 gap-[22px] px-[18px] py-4">
        <View className="gap-2">
          <Text className="text-[28px] font-extrabold tracking-[-0.9px] text-text-primary">
            Criar conta
          </Text>
          <Text className="text-[14px] leading-5 text-text-muted">
            Dados básicos para iniciar e consultar suas viagens.
          </Text>
        </View>

        <View className="gap-[14px] rounded-[16px] border border-border-default bg-white p-4">
          <InputField
            control={control}
            name="name"
            label="Nome"
            placeholder="Seu nome completo"
            autoCapitalize="words"
            rules={{ required: 'Informe seu nome.' }}
          />

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

          <InputField
            control={control}
            name="phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            autoCapitalize="none"
            rules={{ required: 'Informe seu telefone.' }}
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
              onPress={onBackToLogin}
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
