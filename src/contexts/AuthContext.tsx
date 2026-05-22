import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  target_career: string;
  total_score: number;
  rank_position: number;
  weekly_hours: number;
  total_essays: number;
  average_grade: number;
  streak: number;
  likes_count: number;
  comment_score: number;
  subscription_tier: string | null;
  subscription_end: string | null;
  price_id: string | null;
  active_badge_id: string | null;
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  subscribed: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "bio" | "avatar_url" | "target_career" | "username">>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const isAuthenticated = !!user;

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSubscribed(false); return; }
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!error && data?.subscribed) {
        setSubscribed(true);
      } else {
        setSubscribed(false);
      }
    } catch {
      setSubscribed(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    const [{ data, error }, billingRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, name, bio, avatar_url, target_career, total_score, rank_position, weekly_hours, total_essays, average_grade, streak, likes_count, comment_score, subscription_tier, active_badge_id, created_at")
        .eq("id", userId)
        .single(),
      supabase.rpc("get_my_billing"),
    ]);
    if (!error && data) {
      const billing = Array.isArray(billingRes.data) ? billingRes.data[0] : null;
      setProfile({
        ...(data as any),
        subscription_end: billing?.subscription_end ?? null,
        price_id: billing?.price_id ?? null,
        banco_geral_expires_at: billing?.banco_geral_expires_at ?? null,
      } as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setTimeout(() => {
          fetchProfile(session.user.id);
          checkSubscription();
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkSubscription();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (username: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Pick<Profile, "name" | "bio" | "avatar_url" | "target_career" | "username">>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated, loading, subscribed, login, register, logout, updateProfile, refreshProfile, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
