// A mock authentication provider to simulate user roles for RBAC.
"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import type { Role, Staff } from "./types";
import { getStaff } from "./mock-data";

const allStaff = getStaff();
const initialUser = allStaff.find(s => s.role === 'Admin')!;


interface AuthContextType {
  user: Staff;
  setUserRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff>(initialUser);

  const setUserRole = (role: Role) => {
    const newUserByRole = allStaff.find(s => s.role === role) || allStaff[0];
     setUser(newUserByRole);
  };

  const value = useMemo(() => ({ user, setUserRole }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
