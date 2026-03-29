import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import PDV from "@/pages/pdv";
import Orders from "@/pages/orders";
import Menu from "@/pages/menu";
import Tables from "@/pages/tables";
import Users from "@/pages/users";
import Cash from "@/pages/cash";
import Reports from "@/pages/reports";
import Customers from "@/pages/customers";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading, token } = useAuth();

  if (!token) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (adminOnly && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login"><Login /></Route>

      <Route path="/"><ProtectedRoute component={PDV} /></Route>
      <Route path="/orders"><ProtectedRoute component={Orders} /></Route>
      <Route path="/cash"><ProtectedRoute component={Cash} /></Route>
      <Route path="/customers"><ProtectedRoute component={Customers} /></Route>

      <Route path="/menu"><ProtectedRoute component={Menu} adminOnly /></Route>
      <Route path="/tables"><ProtectedRoute component={Tables} adminOnly /></Route>
      <Route path="/users"><ProtectedRoute component={Users} adminOnly /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} adminOnly /></Route>

      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
