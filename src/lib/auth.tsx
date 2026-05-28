import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { authApi, login } from "./api/client";
import { getAuthToken, setAuthToken } from "./api/storage";
import type { CurrentUser } from "./api/types";

type AuthContextValue = {
  token: string | null;
  user: CurrentUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  login: (correo: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => authApi.me(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ correo, password }: { correo: string; password: string }) => {
      const response = await login(correo, password);
      setAuthToken(response.access_token);
      setToken(response.access_token);
      return authApi.me(response.access_token);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me", getAuthToken()], user);
    },
  });

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? null;
    return {
      token,
      user,
      isLoading: Boolean(token) && meQuery.isLoading,
      isAdmin: Boolean(user?.roles.includes("ADMIN")),
      isTechnician: Boolean(user?.roles.includes("TECNICO")),
      login: async (correo, password) => loginMutation.mutateAsync({ correo, password }),
      logout: () => {
        setAuthToken(null);
        setToken(null);
        queryClient.clear();
      },
    };
  }, [loginMutation, meQuery.data, meQuery.isLoading, queryClient, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
