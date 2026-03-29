import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("pdv_token")
  );
  const [, setLocation] = useLocation();

  const setToken = (newToken: string) => {
    localStorage.setItem("pdv_token", newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem("pdv_token");
    setTokenState(null);
    setLocation("/login");
  };

  // We pass the token in headers if customFetch doesn't pick it up automatically
  const requestOptions = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  const { data: user, isLoading, isError } = useGetMe({
    request: requestOptions,
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

// Utility to get authenticated request options for other hooks
export function useAuthRequest() {
  const { token } = useAuth();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}
