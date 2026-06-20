import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoginScreen, RegisterScreen } from './src/screens';

const queryClient = new QueryClient();

type Screen = 'login' | 'register';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {screen === 'login' ? (
          <LoginScreen onCreateAccount={() => setScreen('register')} />
        ) : (
          <RegisterScreen onBackToLogin={() => setScreen('login')} />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
