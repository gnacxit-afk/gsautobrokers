
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

  const fetchUserRole = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
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
       return appUser;
    } 
    return null;
  }, [firestore]);


  useEffect(() => {
    // If auth is not ready, don't do anything yet.
    if (!auth) {
        // We are not setting loading to false here, because we are waiting for auth.
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const appUser = await fetchUserRole(firebaseUser);
            setUser(appUser);
        } else {
            setUser(null);
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
        const appUser = await fetchUserRole(userCredential.user);
        setUser(appUser);
        return appUser;
    }
    return null;
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push("/login");
  };

  const setUserRole = (role: Role) => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
  };
  
  const reloadUser = useCallback(async () => {
    if (auth?.currentUser) {
        setLoading(true);
        const appUser = await fetchUserRole(auth.currentUser);
        setUser(appUser)
        setLoading(false);
    }
  }, [auth, fetchUserRole]);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUserRole, reloadUser }),
    [user, loading, reloadUser, login, logout, setUserRole]
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
