'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  organizationId: string;
}

export interface AuthOrganization {
  _id: string;
  name: string;
  planType: string;
}

interface AuthState {
  token: string;
  user: AuthUser;
  organization: AuthOrganization;
}

interface AuthContextValue {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser, organization: AuthOrganization) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state: AuthState = JSON.parse(raw);
        setToken(state.token);
        setUser(state.user);
        setOrganization(state.organization);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token: string, user: AuthUser, organization: AuthOrganization) => {
    const state: AuthState = { token, user, organization };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setToken(token);
    setUser(user);
    setOrganization(organization);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setOrganization(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
