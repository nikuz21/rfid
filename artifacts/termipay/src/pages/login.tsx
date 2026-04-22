import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, User, Loader2 } from "lucide-react";

const FORCE_LOGGED_OUT_KEY = "termipay_force_logged_out";
const AUTH_TOKEN_KEY = "termipay_auth_token";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        window.localStorage.removeItem(FORCE_LOGGED_OUT_KEY);
        const token = (data as any)?.token;
        if (token) {
          window.localStorage.setItem(AUTH_TOKEN_KEY, token);
        }
        // 1. I-clear ang lahat ng error state sa cache
        queryClient.clear();
        
        // 2. I-manual set ang 'me' query data para hindi na mag-loading ang useAuth hook
        // 'data' dito ay ang response galing sa login API (yung may user info)
        queryClient.setQueryData(getGetMeQueryKey(), data);
        
        // 3. I-invalidate para masiguro na fresh ang data mula sa server
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        
        // 4. Redirect sa Dashboard
        setLocation("/");
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || "Invalid username or password");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    setError("");
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-100" data-testid="login-page">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight" data-testid="text-app-title">Fare Collection System</h1>
          <p className="text-muted-foreground mt-1">Local Transport Cooperative (Calbayog City)</p>
        </div>

        <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Admin Console</CardTitle>
            <CardDescription>Sign in to manage your transit system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in zoom-in duration-200" data-testid="text-login-error">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 focus-visible:ring-primary"
                    data-testid="input-username"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 focus-visible:ring-primary"
                    data-testid="input-password"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold">
                Authorized Personnel Only
              </p>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          TermiPay Admin Dashboard &copy; 2026
        </p>
      </div>
    </div>
  );
}