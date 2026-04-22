import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CardRegistrationPage from "@/pages/card-registration";
import TransactionsPage from "@/pages/transactions";
import UserManagementPage from "@/pages/user-management";
import FareMatrixPage from "@/pages/fare-matrix";
import ReportsPage from "@/pages/reports";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";

function normalizeApiBaseUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

/**
 * LOADING COMPONENT
 * Ipinapakita habang chine-check kung may active session.
 */
function FullPageLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
        TermiPay: Validating Session...
      </p>
    </div>
  );
}

/**
 * PROTECTED ROUTE GUARD
 * Hinaharangan ang access kung hindi naka-login.
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, error } = useAuth();

  // FIX: isLoading is true only when we don't have an error yet.
  // If error exists (401), we stop loading and redirect to login.
  if (isLoading && !error) {
    return <FullPageLoading />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

/**
 * LOGIN ROUTE GUARD
 * Ipinapakita ang login page, o ni-redirect sa dashboard kung logged in na.
 */
function LoginRoute() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading && !error) {
    return <FullPageLoading />;
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <LoginPage />;
}

/**
 * MAIN ROUTER STRATEGY
 */
function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={LoginRoute} />
      
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      
      <Route path="/card-registration">
        <ProtectedRoute component={CardRegistrationPage} />
      </Route>
      
      <Route path="/transactions">
        <ProtectedRoute component={TransactionsPage} />
      </Route>
      
      <Route path="/users">
        <ProtectedRoute component={UserManagementPage} />
      </Route>
      
      <Route path="/fare-matrix">
        <ProtectedRoute component={FareMatrixPage} />
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// React Query Client with global defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Critical: Prevent infinite retries on 401 errors
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  React.useEffect(() => {
    const baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || null);
    setBaseUrl(baseUrl);
    setAuthTokenGetter(() => window.localStorage.getItem("termipay_auth_token"));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={(import.meta.env.BASE_URL || "").replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;