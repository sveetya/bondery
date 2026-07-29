import type { Session, User } from "better-auth/types";
import { createContext, useContext } from "react";

export type AuthSessionPayload = {
  session: Session;
  user: User;
};

export type AuthContextValue = {
  session: AuthSessionPayload | null;
  isLoadingSession: boolean;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
