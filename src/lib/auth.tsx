"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff } from "./types";
import { getStaff } from "./mock-data";

// A mock authentication provider to simulate user roles for RBAC.

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (email: string, password_not_used: string) => Promise<Staff | null>;
  logout: () => void;
  setUserRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const allStaff = getStaff();
  
  useEffect(() => {
    // In a real app, you'd check a token in localStorage or an HttpOnly cookie
    try {
      const storedUser = localStorage.getItem('autosales-user');
      if (storedUser) {
        const foundUser = allStaff.find(s => s.id === JSON.parse(storedUser).id);
        setUser(foundUser || null);
      }
    } catch (e) {
      // Could be in a server environment
      console.log("Reading localStorage failed, this is expected on SSR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password_not_used: string): Promise<Staff | null> => {
    // This is a mock login. In a real app, you'd call an API.
    // The password is not used, we just find the user by email for this demo.
    const foundUser = allStaff.find(staff => staff.email.toLowerCase() === email.toLowerCase());

    if (foundUser) { // In real app, you would also check password
      setUser(foundUser);
      localStorage.setItem('autosales-user', JSON.stringify(foundUser));
      router.push("/");
      return foundUser;
    }
    
    // In a real app, throw an error for wrong credentials
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autosales-user');
    router.push("/login");
  };

  const setUserRole = (role: Role) => {
    if (!user) return;
    const newUserByRole = allStaff.find(s => s.role === role) || allStaff[0];
    setUser(newUserByRole);
     if (newUserByRole) {
      localStorage.setItem('autosales-user', JSON.stringify(newUserByRole));
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout, setUserRole }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
