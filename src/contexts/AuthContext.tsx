import React, { createContext, useContext, useState, ReactNode } from "react";
import { currentUser, type User } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(currentUser);
  const isAuthenticated = !!user;

  const login = async (_email: string, _password: string) => {
    // Mock login - will be replaced with Supabase
    setUser(currentUser);
  };

  const register = async (name: string, email: string, _password: string) => {
    setUser({ ...currentUser, name, email });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
