"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff } from "./types";
import { useUser, useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (email: string, password_not_used: string) => Promise<Staff | null>; // This is now a mock, will be replaced
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const firebaseAuth = useFirebaseAuth();
  const firestore = useFirestore();
  const { user: firebaseUser, loading: firebaseUserLoading } = useUser();

  const reloadUser = async () => {
    if (firebaseUser && firestore) {
      const userDoc = await getDoc(doc(firestore, 'staff', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as Staff;
        setUser(userData);
        localStorage.setItem('autosales-user-role', userData.role);
      }
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (firebaseUser && firestore) {
        const userDoc = await getDoc(doc(firestore, 'staff', firebaseUser.uid));
        if (userDoc.exists()) {
           const userData = { id: userDoc.id, ...userDoc.data() } as Staff;
           const storedRole = localStorage.getItem('autosales-user-role') as Role;
           // If a role is stored and valid, use it. Otherwise, use the one from DB.
           if (storedRole && ["Admin", "Supervisor", "Broker"].includes(storedRole)) {
             setUser({ ...userData, role: storedRole });
           } else {
             setUser(userData);
           }
        } else {
            setUser(null); // No staff profile found
        }
      } else if (!firebaseUser) {
        setUser(null);
      }
      setLoading(false);
    }
    if (!firebaseUserLoading) {
        fetchUser();
    }
  }, [firebaseUser, firestore, firebaseUserLoading]);


  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password_not_used: string): Promise<Staff | null> => {
    // This is just a placeholder now. Login is handled by FirebaseUI or other Firebase methods.
    // The actual login happens on the login page now.
    // This function can be removed or repurposed. For now, it does nothing.
    console.error("The mock login function was called, but login is now handled by Firebase.");
    return null;
  };

  const logout = () => {
    if (firebaseAuth) {
        firebaseAuth.signOut();
    }
    setUser(null);
    localStorage.removeItem('autosales-user-role');
    router.push("/login");
  };

  const setUserRole = (role: Role) => {
    // This simulates switching roles for a user who might have multiple.
    // In a real app, this might involve changing custom claims.
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('autosales-user-role', role);
  };

  const value = useMemo(() => ({ user, loading, login, logout, setUserRole, reloadUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
