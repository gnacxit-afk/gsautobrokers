
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

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

  const firestore = useFirestore();
  const auth = useAuth();
  
  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    const staffCollection = collection(firestore, 'staff');
    let q = query(staffCollection, where("authUid", "==", fbUser.uid));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const staffDoc = querySnapshot.docs[0];
        const staffData = staffDoc.data() as Staff;
        
        if (staffData.email === MASTER_ADMIN_EMAIL && staffData.authUid !== fbUser.uid) {
            await setDoc(doc(firestore, "staff", staffDoc.id), { authUid: fbUser.uid }, { merge: true });
        }
        
        return {
            id: staffDoc.id,
            authUid: staffData.authUid,
            name: staffData.name,
            email: staffData.email,
            avatarUrl: staffData.avatarUrl,
            role: staffData.role,
            dui: staffData.dui
        };
    } else {
         if (fbUser.email === MASTER_ADMIN_EMAIL) {
             const newUserProfile: Omit<Staff, 'id'> = {
                 authUid: fbUser.uid,
                 name: "Angel Nacxit Gomez Campos",
                 email: fbUser.email!,
                 role: 'Admin',
                 createdAt: serverTimestamp(),
                 hireDate: serverTimestamp(),
                 avatarUrl: '',
                 dui: "04451625-5",
             };
             const docRef = await addDoc(staffCollection, newUserProfile);
             return { id: docRef.id, ...newUserProfile } as User;
         }
         throw new Error("User profile not found in database.");
    }
  }, [firestore]);

 useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
            if (firebaseUser) {
                const userProfile = await fetchAppUser(firebaseUser);
                setUser(userProfile);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            console.error("Auth state change error:", error);
            setAuthError(error.message);
            setUser(null);
        } finally {
            // This is the crucial change: setLoading(false) is now guaranteed to run.
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, [auth, fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // The onAuthStateChanged listener will handle setting the user and final loading state.
    } catch (error: any) {
        setAuthError(error.message);
        setLoading(false); // Set loading to false on login failure.
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    setUser(null); // Immediately clear the user to update the UI
    await signOut(auth);
    // The onAuthStateChanged listener will confirm the user is null and loading is false.
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
