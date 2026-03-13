import React, { createContext, useContext, useState, ReactNode } from "react";
import { type User, loginUser, registerUser, setCurrentUser, updateUserProfile, registeredUsers } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "bio" | "avatarUrl" | "targetCareer">>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    const found = loginUser(email, password);
    if (found) {
      setCurrentUser(found);
      setUser({ ...found });
      return { success: true };
    }
    return { success: false, error: "E-mail ou senha incorretos." };
  };

  const register = async (username: string, email: string, password: string) => {
    const exists = registeredUsers.find(u => u.email === email);
    if (exists) return { success: false, error: "E-mail já cadastrado." };
    const newUser = registerUser(username, email, password);
    setCurrentUser(newUser);
    setUser({ ...newUser });
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const updateProfile = (updates: Partial<Pick<User, "name" | "bio" | "avatarUrl" | "targetCareer">>) => {
    if (!user) return;
    const updated = updateUserProfile(user.id, updates);
    if (updated) setUser({ ...updated });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
