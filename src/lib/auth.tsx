"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStaff } from "./mock-data";
import type { Role, Staff, User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => User | null;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const reloadUser = () => {
    // This is a mock function, in a real app this would re-fetch user data
    // from a server or re-validate a token.
    if (user) {
      const allStaff = getStaff();
      const updatedUser = allStaff.find(s => s.id === user.id) as Staff | undefined;
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  }


  useEffect(() => {
    // Simulate checking for a logged-in user
    const loggedInUser = localStorage.getItem("autosales-user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  const login = (email: string, pass: string): User | null => {
    // The actual login happens on the login page now.
    // This function can be removed or repurposed. For now, it does nothing.
    console.error("The mock login function was called, but login is now handled by Firebase.");
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("autosales-user");
    localStorage.removeItem("autosales-user-role");
    router.push("/login");
  };

  const setUserRole = (role: Role) => {
    // This simulates switching roles for a user who might have multiple.
    // In a real app, this might involve changing JWT claims.
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem("autosales-user", JSON.stringify(updatedUser));
    localStorage.setItem("autosales-user-role", role);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, setUserRole, reloadUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
