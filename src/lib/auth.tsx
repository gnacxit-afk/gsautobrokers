
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
  auth: any;
  MASTER_ADMIN_EMAIL: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    // Use a direct getDoc for performance, as it's much faster than a query.
    // The document ID in 'staff' should match the Firebase Auth UID.
    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    const staffDocSnap = await getDoc(staffDocRef);

    if (staffDocSnap.exists()) {
        const staffData = staffDocSnap.data() as Omit<Staff, 'id'>;
        return {
            id: staffDocSnap.id,
            ...staffData
        } as User;
    }
    
    // Fallback for Master Admin, who might have a different UID initially
    // or whose profile needs to be created on first login.
    if (fbUser.email === MASTER_ADMIN_EMAIL) {
        const staffCollection = collection(firestore, 'staff');
        const q = query(staffCollection, where("email", "==", MASTER_ADMIN_EMAIL));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0];
            // If the admin doc ID doesn't match the auth UID, it's a legacy setup.
            // We should ideally migrate this, but for now, we'll return the found profile.
            return { id: adminDoc.id, ...adminDoc.data() } as User;
        } else {
            // Master admin logged in for the first time, create their profile.
            const newAdminProfile: Omit<Staff, 'id'> = {
                authUid: fbUser.uid,
                name: "Angel Nacxit Gomez Campos",
                email: fbUser.email!,
                role: 'Admin',
                createdAt: serverTimestamp(),
                hireDate: serverTimestamp(),
                avatarUrl: '',
                dui: "04451625-5",
            };
            // Create the document with the Auth UID as the document ID
            await setDoc(doc(firestore, 'staff', fbUser.uid), newAdminProfile);
            return { id: fbUser.uid, ...newAdminProfile } as User;
        }
    }
    
    // If no profile is found after all checks, the user is not a valid staff member.
    console.error("User profile not found in 'staff' collection for UID:", fbUser.uid);
    return null;
  }, [firestore]);

 useEffect(() => {
    if (!auth || !firestore) {
        // If services aren't ready, we are technically still 'loading'
        // as we can't determine auth state yet.
        setLoading(true); 
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Always start in a loading state on auth change
      if (firebaseUser) {
        try {
          const userProfile = await fetchAppUser(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
            setAuthError(null);
          } else {
            setUser(null);
            setAuthError("Your user profile could not be found.");
            await signOut(auth);
          }
        } catch (error: any) {
          console.error("Failed to fetch app user profile:", error);
          setUser(null);
          setAuthError(error.message || "An error occurred fetching your profile.");
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Finish loading only after all operations are complete
    });

    return () => unsubscribe();
  }, [auth, firestore, fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle the rest, so we just wait.
    } catch (error: any) {
        let friendlyMessage = "An unexpected error occurred.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                friendlyMessage = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "The email address is not valid.";
                break;
        }
        setAuthError(friendlyMessage);
        setUser(null);
        setLoading(false); // Explicitly stop loading on a failed login attempt
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push('/login');
  }, [auth, router]);

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
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser, auth, MASTER_ADMIN_EMAIL }),
    [user, loading, authError, login, logout, setUserRole, reloadUser, auth]
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
