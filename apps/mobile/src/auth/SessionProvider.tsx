import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { setApiToken, setUnauthorizedHandler } from '../api/client';

type AuthUser = { id: string; email: string; role: string };
type Session = { token: string; user: AuthUser };

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session) => Promise<void>;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const SESSION_KEY = 'bikeshare.session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Session;
          setSessionState(parsed);
          setApiToken(parsed.token);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setSession = async (nextSession: Session) => {
    setSessionState(nextSession);
    setApiToken(nextSession.token);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
  };

  const clearSession = async () => {
    setSessionState(null);
    setApiToken(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  };

  const value = useMemo(
    () => ({ session, isLoading, setSession, clearSession, logout: clearSession }),
    [session, isLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
