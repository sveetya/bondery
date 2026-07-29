import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect, useMemo } from "react";
import { authClient } from "./client";
import { AuthContext, type AuthContextValue } from "./useAuth";

SplashScreen.preventAutoHideAsync().catch(() => {});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const sessionState = authClient?.useSession() ?? {
    data: null,
    isPending: !authClient,
  };

  const session = sessionState.data ?? null;
  const isLoadingSession = sessionState.isPending;

  useEffect(() => {
    if (!isLoadingSession) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoadingSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !isLoadingSession && session !== null,
      isLoadingSession,
      session,
    }),
    [isLoadingSession, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
