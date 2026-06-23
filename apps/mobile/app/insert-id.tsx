import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, ArrowLeft, Bike, CheckCircle2 } from 'lucide-react-native';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components';

import { useActiveRideQuery, useStartRideMutation } from '../src/rides';
import { colors } from '../src/theme/colors';

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function InsertIdRoute() {
  const router = useRouter();
  const { bicycleId: bicycleIdParam } = useLocalSearchParams<{ bicycleId?: string | string[] }>();
  const activeRideQuery = useActiveRideQuery();
  const startRideMutation = useStartRideMutation();

  const initialBicycleId = useMemo(
    () => getSearchParamValue(bicycleIdParam).trim(),
    [bicycleIdParam],
  );
  const [bicycleId, setBicycleId] = useState(initialBicycleId);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const trimmedBicycleId = bicycleId.trim();
  const isCheckingRide = activeRideQuery.isFetching;
  const backendErrorMessage = startRideMutation.error?.message ?? null;
  const isLoadingStatus = isCheckingRide || startRideMutation.isPending;

  useEffect(() => {
    if (activeRideQuery.data) {
      router.replace('/ride/current');
    }
  }, [activeRideQuery.data, router]);

  useEffect(() => {
    setBicycleId(initialBicycleId);
  }, [initialBicycleId]);

  if (activeRideQuery.data) {
    return null;
  }

  const previewTitle = isCheckingRide
    ? 'Verificando sua corrida atual'
    : startRideMutation.isPending
      ? 'Iniciando aluguel'
      : backendErrorMessage
        ? 'Não foi possível iniciar'
    : trimmedBicycleId
      ? 'Bicicleta pronta para iniciar'
      : 'Nenhuma bicicleta selecionada';

  const previewDescription = isCheckingRide
    ? 'Confirmando se já existe uma corrida em andamento.'
    : startRideMutation.isPending
      ? 'Confirmando a disponibilidade da bicicleta.'
      : backendErrorMessage
        ? backendErrorMessage
    : trimmedBicycleId
      ? `Identificador ${trimmedBicycleId}. Toque em confirmar para começar.`
      : 'Digite o identificador mostrado na bicicleta para continuar.';

  const statusIconContainerClassName = backendErrorMessage
    ? 'bg-text-danger/10'
    : trimmedBicycleId && !isLoadingStatus
      ? 'bg-status-success/10'
      : 'bg-brand-primary/10';

  const renderStatusIcon = () => {
    if (isLoadingStatus) {
      return <ActivityIndicator color={colors.brand.primary} size="small" />;
    }

    if (backendErrorMessage) {
      return <AlertCircle color={colors.text.danger} size={20} strokeWidth={2.4} />;
    }

    if (trimmedBicycleId) {
      return <CheckCircle2 color={colors.status.success} size={20} strokeWidth={2.4} />;
    }

    return <Bike color={colors.brand.primary} size={20} strokeWidth={2.4} />;
  };

  const handleSubmit = async () => {
    const nextBicycleId = bicycleId.trim();

    startRideMutation.reset();
    setValidationMessage(null);

    if (!nextBicycleId) {
      setValidationMessage('Digite o identificador da bicicleta.');
      return;
    }

    if (activeRideQuery.data) {
      router.replace('/ride/current');
      return;
    }

    try {
      await startRideMutation.mutateAsync({ bicycleId: nextBicycleId });
      router.replace('/ride/current');
    } catch {
      // Error message is rendered from the mutation state.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-between px-6 pb-3 pt-4">
          <View className="gap-5">
            <View className="flex-row items-center">
              <IconButton
                accessibilityLabel="Voltar"
                icon={<ArrowLeft color={colors.text.primary} size={22} strokeWidth={2.4} />}
                onPress={() => router.back()}
                variant="surface"
              />
            </View>

            <View className="gap-2">
              <Text className="text-[32px] font-extrabold tracking-[-1px] text-text-primary">
                Alugar bicicleta
              </Text>
              <Text className="text-[15px] leading-6 text-text-muted">
                Digite o identificador mostrado na bicicleta.
              </Text>
            </View>

            <View className="gap-4 rounded-[24px] border border-border-default bg-white p-4">
              <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
                ID DA BICICLETA
              </Text>

              <View className="rounded-[18px] border border-border-default bg-background-app px-4 py-3">
                <TextInput
                  className="min-h-[28px] text-[16px] text-text-primary"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType="default"
                  onChangeText={(text) => {
                    setBicycleId(text);
                    setValidationMessage(null);
                    if (startRideMutation.error) {
                      startRideMutation.reset();
                    }
                  }}
                  placeholder="Ex.: UFAL-2048"
                  placeholderTextColor={colors.text.placeholder}
                  selectionColor={colors.brand.primary}
                  value={bicycleId}
                />
              </View>

              {validationMessage ? (
                <Text className="text-[12px] text-text-danger">{validationMessage}</Text>
              ) : null}
            </View>

            <View className="gap-4 rounded-[24px] border border-border-default bg-white p-4">
              <Text className="font-mono text-[12px] font-bold uppercase tracking-[1.2px] text-text-muted">
                STATUS
              </Text>

              <View className="flex-row items-start gap-3 rounded-[20px] bg-background-app px-4 py-4">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-full ${statusIconContainerClassName}`}
                >
                  {renderStatusIcon()}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-[16px] font-semibold tracking-[-0.3px] text-text-primary">
                    {previewTitle}
                  </Text>
                  <Text className="text-[13px] leading-5 text-text-muted">
                    {previewDescription}
                  </Text>
                </View>
              </View>
            </View>

            {backendErrorMessage ? (
              <Text className="px-1 text-[13px] leading-5 text-text-danger">
                {backendErrorMessage}
              </Text>
            ) : null}
          </View>

          <View className="pt-4">
            <Button
              disabled={startRideMutation.isPending || isCheckingRide}
              onPress={() => void handleSubmit()}
            >
              Confirmar aluguel
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
