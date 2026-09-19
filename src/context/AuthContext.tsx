import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '../types';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api';

export type AuthMode = 'register' | 'login';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  /** true while the saved session is being checked on first load */
  isRestoring: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  /** Why the visitor is being asked to sign up (shown at the top of the modal) */
  authReason: string;
  setAuthMode: (mode: AuthMode) => void;
  openAuth: (mode?: AuthMode, reason?: string) => void;
  closeAuth: () => void;
  /** Runs `action` now if signed in; otherwise asks the visitor to register first, then runs it */
  requireAuth: (action: () => void, reason?: string) => void;
  register: (input: { name: string; phone: string; password: string }) => Promise<void>;
  login: (input: { phone: string; password: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(() => tokenStore.get() !== null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [authReason, setAuthReason] = useState('');

  const pendingAction = useRef<(() => void) | null>(null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the saved session, and sign out whenever the server rejects our token
  useEffect(() => {
    setUnauthorizedHandler(logout);

    if (tokenStore.get()) {
      api.me()
        .then(({ user }) => setUser(user))
        .catch(() => tokenStore.clear())
        .finally(() => setIsRestoring(false));
    }

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const openAuth = (mode: AuthMode = 'register', reason = '') => {
    setAuthMode(mode);
    setAuthReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => {
    pendingAction.current = null;
    setIsAuthModalOpen(false);
  };

  const requireAuth = (action: () => void, reason = '') => {
    if (user) {
      action();
      return;
    }
    pendingAction.current = action;
    openAuth('register', reason);
  };

  const completeSignIn = (token: string, signedInUser: User) => {
    tokenStore.set(token);
    setUser(signedInUser);
    setIsAuthModalOpen(false);

    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) action();
  };

  const register = async (input: { name: string; phone: string; password: string }) => {
    const { token, user: newUser } = await api.register(input);
    completeSignIn(token, newUser);
  };

  const login = async (input: { phone: string; password: string }) => {
    const { token, user: signedInUser } = await api.login(input);
    completeSignIn(token, signedInUser);
    return signedInUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isRestoring,
        isAuthModalOpen,
        authMode,
        authReason,
        setAuthMode,
        openAuth,
        closeAuth,
        requireAuth,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
