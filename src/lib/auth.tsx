
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/icons";


// TODO: Replace with your actual master admin email address.
// This user will have full admin privileges and will not need an entry in the 'staff' collection.
const MASTER_ADMIN_EMAIL = "gnacxit@gmail.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
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

    // Master Admin Check: If the email matches, grant admin access immediately.
    if (fbUser.email === MASTER_ADMIN_EMAIL) {
      return {
        id: fbUser.uid,
        name: "Master Admin",
        email: fbUser.email,
        avatarUrl: "",
        role: "Admin",
        dui: "N/A",
      };
    }
    
    // For all other users, check the 'staff' collection.
    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    
    try {
        const staffDoc = await getDoc(staffDocRef);

        if (staffDoc.exists()) {
            const staffData = staffDoc.data() as Staff;
            // You can add an 'active' check here if needed in the future
            // if (staffData.active !== true) {
            //   throw new Error("User account is inactive.");
            // }
            return {
                id: fbUser.uid,
                name: staffData.name,
                email: staffData.email,
                avatarUrl: staffData.avatarUrl,
                role: staffData.role,
                dui: staffData.dui,
            };
        } else {
            // If the user is not the master admin and not in staff, they have no access.
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
        // After successful Firebase Auth, onAuthStateChanged will trigger `fetchAppUser`
        // which contains the new logic. No need to manually set user here.
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
    // onAuthStateChanged will handle setting user to null and redirecting
  }, [auth]);

  const setUserRole = useCallback((role: Role) => {
    // This is for local role-switching simulation and should not affect the master admin.
    if (user && user.email !== MASTER_ADMIN_EMAIL) {
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
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser }),
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
