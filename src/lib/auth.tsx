
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/icons";

export const MASTER_ADMIN_EMAIL = "gnacxit@gmail.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
  MASTER_ADMIN_EMAIL: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();

  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    // Master Admin Check
    if (fbUser.email === MASTER_ADMIN_EMAIL) {
      const masterAdminDUI = '04451625-5';
      const masterAdminName = "Angel Nacxit Gomez Campos";
      const staffDocRef = doc(firestore, 'staff', masterAdminDUI);
      const staffDoc = await getDoc(staffDocRef);
      if (!staffDoc.exists()) {
        await setDoc(staffDocRef, {
          id: masterAdminDUI,
          authUid: fbUser.uid,
          name: masterAdminName,
          email: fbUser.email,
          role: "Admin",
          createdAt: serverTimestamp(),
          avatarUrl: "",
        });
      }
      return {
        id: masterAdminDUI,
        authUid: fbUser.uid,
        name: masterAdminName,
        email: fbUser.email,
        avatarUrl: "",
        role: "Admin",
      };
    }
    
    // For all other users, find their staff profile via their auth UID.
    const staffCollection = collection(firestore, 'staff');
    const q = query(staffCollection, where("authUid", "==", fbUser.uid));
    
    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data() as Staff;
            
            return {
                id: staffData.id, // DUI
                authUid: staffData.authUid,
                name: staffData.name,
                email: staffData.email,
                avatarUrl: staffData.avatarUrl,
                role: staffData.role,
            };
        } else {
             throw new Error("User not found in staff directory.");
        }

    } catch (error: any) {
        console.error("Error fetching or validating user document:", error);
        setAuthError(error.message);
        if(auth) await signOut(auth);
        return null;
    }
  }, [firestore, auth]);


  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
            const userProfile = await fetchAppUser(firebaseUser);
            setUser(userProfile);
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, fetchAppUser]);


  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/leads");
      }
    }
  }, [user, loading, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        setAuthError(error.message);
        setUser(null);
    } finally {
        setLoading(false);
    }
  }, [auth]);


  const logout = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    await signOut(auth);
  }, [auth]);

  const setUserRole = useCallback((role: Role) => {
    if (user && user.email === MASTER_ADMIN_EMAIL) {
       setUser(currentUser => {
          if(!currentUser) return null;
          return { ...currentUser, role };
      });
    }
  }, [user]);
  
  const reloadUser = useCallback(async () => {
     if (auth?.currentUser) {
        setLoading(true);
        const updatedAppUser = await fetchAppUser(auth.currentUser);
        setUser(updatedAppUser);
        setLoading(false);
    }
  }, [auth, fetchAppUser]);

  const value = useMemo(
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser, MASTER_ADMIN_EMAIL }),
    [user, loading, authError, login, logout, setUserRole, reloadUser]
  );
  
  if (loading && pathname !== "/login") {
     return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Logo />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Application...</p>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
