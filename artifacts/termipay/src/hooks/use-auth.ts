import { useCallback, useState } from "react";
import { useGetMe, getGetMeQueryKey, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const FORCE_LOGGED_OUT_KEY = "termipay_force_logged_out";
const AUTH_TOKEN_KEY = "termipay_auth_token";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const forceLoggedOut =
    typeof window !== "undefined" &&
    window.localStorage.getItem(FORCE_LOGGED_OUT_KEY) === "1";

  // 1. Fetch current session
  const { data: user, isLoading, error, refetch } = useGetMe({
    queryKey: getGetMeQueryKey(),
    query: { 
      enabled: !forceLoggedOut,
      retry: false, 
      staleTime: 0,
      gcTime: 0 // Siguraduhing hindi naka-cache ang sensitive data
    },
  } as any);

  const isApiOfflineError =
    !!error &&
    typeof error === "object" &&
    "message" in (error as Record<string, unknown>) &&
    String((error as Record<string, unknown>).message).toLowerCase().includes("failed to fetch");

  // 2. Logout Mutation
  const logoutMutation = useLogout();

  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  }

  const logout = useCallback(async () => {
    console.log("TermiPay: Triggering Workspace Logout...");
    setIsLoggingOut(true);

    const forceRedirect = () => {
      try {
        setLocation("/login");
      } catch {
        const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
        window.location.replace(`${window.location.origin}${basePath}/login`);
      }
    };

    // Guaranteed fallback in case any awaited promise hangs.
    const redirectTimer = window.setTimeout(forceRedirect, 1500);

    try {
      window.localStorage.setItem(FORCE_LOGGED_OUT_KEY, "1");
      window.localStorage.removeItem(AUTH_TOKEN_KEY);

      // Stop ongoing queries.
      await withTimeout(queryClient.cancelQueries(), 1000);

      // Best-effort server logout; do not await this.
      logoutMutation.mutate(undefined as any);
    } catch (err) {
      console.warn("TermiPay: API logout error (ignoring for redirect)", err);
    } finally {
      window.clearTimeout(redirectTimer);
      queryClient.clear();
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      forceRedirect();
      setIsLoggingOut(false);
    }
  }, [queryClient, logoutMutation, setLocation]);

  return {
    user: user ?? null,
    isLoading: forceLoggedOut ? false : isLoading,
    error,
    isAuthenticated: forceLoggedOut ? false : isApiOfflineError ? false : !!user,
    logout,
    isLoggingOut,
    refetchUser: refetch,
  };
}