import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

import { SessionProvider, useSession } from "../src/auth/SessionProvider";
import { colors } from "../src/theme/colors";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { isLoading } = useSession();

  // useEffect(() => {
  //  async function configurarNavBar() {
  //     // Coloque aqui a mesma cor da sua BottomBar
  //     await NavigationBar.setHidden(false);

  //     // Ajuste a cor dos botões (ícones) para dar contraste
  //     // Use 'light' para fundo escuro ou 'dark' para fundo claro
  //      NavigationBar.setStyle('dark');
  //   }

  //   configurarNavBar();
  // }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-app">
        <Text className="text-text-muted">Carregando...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.app },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="insert-id" />
      </Stack>
    </>
  );
}
