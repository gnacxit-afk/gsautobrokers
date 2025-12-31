"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
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
  const firestore = useFirestore();
  const { auth } = useFirebase();

  const fetchUserRole = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!firestore) return null;
    const staffDocRef = doc(firestore, 'staff', firebaseUser.uid);
    const staffDoc = await getDoc(staffDocRef);
    if (staffDoc.exists()) {
        const staffData = staffDoc.data() as Staff;
        const appUser: User = {
            id: firebaseUser.uid,
            name: staffData.name,
            email: staffData.email,
            avatarUrl: staffData.avatarUrl,
            role: staffData.role
        };
        setUser(appUser);
        localStorage.setItem("autosales-user", JSON.stringify(appUser));
    } else {
        // Handle case where user exists in Auth but not in 'staff' collection
        setUser(null);
    }
  }, [firestore]);


  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserRole(firebaseUser);
      } else {
        setUser(null);
        localStorage.removeItem("autosales-user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserRole]);


  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, pass: string): Promise<User | null> => {
    if (!auth) return null;
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
        await fetchUserRole(userCredential.user);
        // The user state will be set by the onAuthStateChanged listener,
        // but we can optimistically return it here after fetching.
        if (firestore) {
            const staffDocRef = doc(firestore, 'staff', userCredential.user.uid);
            const staffDoc = await getDoc(staffDocRef);
             if (staffDoc.exists()) {
                const staffData = staffDoc.data() as Staff;
                const appUser: User = {
                    id: userCredential.user.uid,
                    name: staffData.name,
                    email: staffData.email,
                    avatarUrl: staffData.avatarUrl,
                    role: staffData.role
                };
                return appUser;
            }
        }
    }
    return null;
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("autosales-user");
    localStorage.removeItem("autosales-user-role"); // Also clear this if used
    router.push("/login");
  };

  const setUserRole = (role: Role) => {
    // This is now primarily a front-end simulation for role switching if needed.
    // The source of truth for the role is Firestore.
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem("autosales-user", JSON.stringify(updatedUser));
  };
  
  const reloadUser = useCallback(async () => {
    if (auth?.currentUser) {
        setLoading(true);
        await fetchUserRole(auth.currentUser);
        setLoading(false);
    }
  }, [auth, fetchUserRole]);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUserRole, reloadUser }),
    [user, loading, reloadUser]
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
