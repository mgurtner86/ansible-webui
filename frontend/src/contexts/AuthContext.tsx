import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User, Session } from '../types';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const { user, session } = await api.auth.getSession();
      setUser(user);
      setSession(session);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { user, session } = await api.auth.login(email, password);
    setUser(user);
    setSession(session);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { user, session } = await api.auth.register(email, password, fullName);
    setUser(user);
    setSession(session);
  }

  async function signOut() {
    await api.auth.logout();
    setUser(null);
    setSession(null);
  }

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const rolePermissions: Record<string, string[]> = {
      manager: ['projects:*', 'inventories:*', 'templates:*', 'jobs:*', 'schedules:*'],
      operator: ['projects:read', 'inventories:read', 'templates:read', 'templates:execute', 'jobs:read', 'jobs:create'],
      viewer: ['projects:read', 'inventories:read', 'templates:read', 'jobs:read'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.some(p => p === permission || p.endsWith(':*'));
  }

  const value = {
    user,
    profile: user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
